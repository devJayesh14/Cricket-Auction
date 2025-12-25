import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { BidService, CurrentBidResponse } from '../../../core/services/bid.service';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService } from '../../../core/services/team.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ImageService } from '../../../core/services/image.service';
import { AuctionEvent } from '../../../core/models/event.model';
import { Player } from '../../../core/models/player.model';
import { interval, Subscription } from 'rxjs';
import { PlayerResultAnimationComponent, PlayerSoldData, PlayerUnsoldData } from '../../../shared/components/player-result-animation/player-result-animation.component';

@Component({
  selector: 'app-live-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerResultAnimationComponent],
  templateUrl: './live-auction.component.html',
  styleUrls: ['./live-auction.component.scss']
})
export class LiveAuctionComponent implements OnInit, OnDestroy {
  eventId: string = '';
  event: AuctionEvent | null = null;
  isLoading = false;
  timeRemaining: string = '';
  timeRemainingParts: { label: string; value: string }[] = [];
  isAuctionStarted = false;
  currentPlayer: Player | null = null;
  currentBidAmount: number = 0;
  nextBidAmount: number | 0 = 0;
  winningTeam: any = null;
  bidAmount: number = 0;
  isPlacingBid = false;
  availablePlayers: Player[] = [];
  selectedPlayerId: string = '';
  isRandomMode: boolean = false;
  autoStartEnabled: boolean = true; // Auto-start enabled by default
  
  private countdownSubscription?: Subscription;
  private refreshSubscription?: Subscription;
  private bidReceivedSubscription?: Subscription;
  private playerUpdateSubscription?: Subscription;
  private playerSoldSubscription?: Subscription;
  private playerUnsoldSubscription?: Subscription;
  private auctionJoinedSubscription?: Subscription;
  private teamBalanceSubscription?: Subscription;
  private availablePlayersSubscription?: Subscription;
  private eventUpdateSubscription?: Subscription;
  private auctionEndedSubscription?: Subscription;
  currentUser: any;
  
  // Auction ended state
  showThankYouAnimation = false;
  auctionEndedData: any = null;
  
  // Animation data
  soldAnimationData: PlayerSoldData | null = null;
  unsoldAnimationData: PlayerUnsoldData | null = null;
  
  // Timer for player auction (60 seconds)
  playerAuctionTimer: number = 0;
  private playerTimerSubscription?: Subscription;
  playerStartTime: Date | null = null;
  
  // Team balance (updated from API)
  teamBalance: number | null = null;
  
  // Track if current user is the winning bidder
  isCurrentWinningBidder: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private bidService: BidService,
    private playerService: PlayerService,
    public authService: AuthService,
    private teamService: TeamService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    public imageService: ImageService
  ) {
    this.currentUser = this.authService.currentUserValue;
    
    // Subscribe to user updates to refresh currentUser when it changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Team balance will come from socket team:balance event
    });
  }

  ngOnInit(): void {
    // Get eventId from route params
    const routeId = this.route.snapshot.params['id'];
    
    // Validate eventId
    if (!routeId) {
      console.error('Event ID is missing from route params:', this.route.snapshot.params);
      this.isLoading = false;
      this.notificationService.error('Invalid event ID. Please go back and try again.');
      return;
    }
    
    // Ensure eventId is a string
    this.eventId = typeof routeId === 'string' ? routeId : String(routeId);
    console.log('Loading event with ID:', this.eventId);
    
    // Load auto-start preference from localStorage
    const savedAutoStart = localStorage.getItem('auctionAutoStart');
    if (savedAutoStart !== null) {
      this.autoStartEnabled = savedAutoStart === 'true';
    }
    
    // Set loading state
    this.isLoading = true;
    
    // Connect to socket first
    this.socketService.connect();
    
    // Setup socket listeners before joining
    this.setupSocketListeners();
    
    // Wait a bit for socket connection, then join auction room
    setTimeout(() => {
      if (this.socketService.isConnected()) {
        this.socketService.joinAuction(this.eventId);
      } else {
        // Retry connection
        this.socketService.connect();
        setTimeout(() => {
          if (this.socketService.isConnected()) {
            this.socketService.joinAuction(this.eventId);
          } else {
            this.isLoading = false;
            this.notificationService.error('Failed to connect to auction server. Please try again.');
          }
        }, 2000);
      }
    }, 500);
    
    // Timeout fallback - if no response after 10 seconds, show error
    setTimeout(() => {
      if (this.isLoading && !this.event) {
        this.isLoading = false;
        this.notificationService.error('Failed to load event. Please check if the event exists and try again.');
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
    this.bidReceivedSubscription?.unsubscribe();
    this.playerUpdateSubscription?.unsubscribe();
    this.playerSoldSubscription?.unsubscribe();
    this.playerUnsoldSubscription?.unsubscribe();
    this.playerTimerSubscription?.unsubscribe();
    this.auctionJoinedSubscription?.unsubscribe();
    this.teamBalanceSubscription?.unsubscribe();
    this.availablePlayersSubscription?.unsubscribe();
    this.eventUpdateSubscription?.unsubscribe();
    this.auctionEndedSubscription?.unsubscribe();
    
    // Leave auction room
    if (this.eventId) {
      this.socketService.leaveAuction(this.eventId);
    }
  }

  // Removed loadEvent() - now using socket auction:joined event

  setupSocketListeners(): void {
    // Listen for auction joined event - contains all initial data
    this.auctionJoinedSubscription = this.socketService.onAuctionJoined().subscribe((data: any) => {
      if (data.success) {
        console.log('Auction joined, received data:', data);
        this.isLoading = false;
        
        // Set event data
        if (data.event) {
          this.event = data.event;
          this.checkAuctionStatus();
          this.startCountdown();
        }
        
        // Set current player if exists
        if (data.currentPlayer) {
          this.currentPlayer = data.currentPlayer.player;
          this.currentBidAmount = data.currentPlayer.currentBidAmount || data.currentPlayer.player.basePrice;
          const bidIncrement = data.event?.settings?.bidIncrement || 50;
          this.nextBidAmount = this.currentBidAmount + bidIncrement;
          this.winningTeam = data.currentPlayer.currentBid ? {
            _id: data.currentPlayer.currentBid.teamId,
            name: data.currentPlayer.currentBid.teamName
          } : null;
          
          // Check if current user is the winning bidder
          this.isCurrentWinningBidder = this.isTeamOwner() && data.currentPlayer.currentBid && (
            data.currentPlayer.currentBid.teamId === this.currentUser.teamId ||
            (this.currentUser.team && data.currentPlayer.currentBid.teamId === this.currentUser.team._id)
          );
          
          if (this.isTeamOwner()) {
            this.bidAmount = this.nextBidAmount;
          }
          
          if (data.currentPlayer.startTime) {
            this.playerStartTime = new Date(data.currentPlayer.startTime);
            this.startPlayerTimer();
          }
        }
        
        // Set available players
        if (data.availablePlayers) {
          this.availablePlayers = data.availablePlayers;
        }
        
        // Set team balance
        if (data.teamBalance !== null && data.teamBalance !== undefined && this.isTeamOwner()) {
          this.teamBalance = Math.max(0, data.teamBalance);
        }
      } else {
        console.error('Failed to join auction:', data.error);
        this.isLoading = false;
        this.event = null; // Explicitly set to null to show error state
        this.notificationService.error(data.error || 'Failed to join auction. The event may not exist or you may not have access.');
      }
    });

    // Listen for team balance updates
    this.teamBalanceSubscription = this.socketService.onTeamBalanceUpdate().subscribe((data: any) => {
      if (this.isTeamOwner() && data.teamBalance !== null && data.teamBalance !== undefined) {
        const newBalance = Math.max(0, data.teamBalance);
        const oldBalance = this.teamBalance;
        this.teamBalance = newBalance;
        
        // Update currentUser team data for consistency
        if (this.currentUser?.team) {
          this.currentUser.team.remainingBudget = this.teamBalance;
        }
        
        // Show notification if balance decreased (player was purchased)
        if (oldBalance !== null && newBalance < oldBalance) {
          const spent = oldBalance - newBalance;
          this.notificationService.success(`Player purchased! Balance updated: ₹${oldBalance.toLocaleString()} → ₹${newBalance.toLocaleString()} (Spent: ₹${spent.toLocaleString()})`);
        } else if (oldBalance === null) {
          // First time loading balance
          console.log('Team balance loaded:', this.teamBalance);
        }
      }
    });

    // Listen for available players updates
    this.availablePlayersSubscription = this.socketService.onAvailablePlayersUpdate().subscribe((data: any) => {
      if (data.players) {
        this.availablePlayers = data.players;
        
        // Auto-start next player if enabled, admin, no current player, and players available
        if (this.autoStartEnabled && this.isAdmin() && !this.currentPlayer && this.availablePlayers.length > 0) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            this.autoStartNextPlayer();
          }, 500);
        }
      }
    });

    // Listen for event updates
    this.eventUpdateSubscription = this.socketService.onEventUpdate().subscribe((data: any) => {
      if (data && this.event) {
        if (data.settings) {
          this.event = { ...this.event, settings: { ...this.event.settings, ...data.settings } };
        }
        if (data.stats) {
          this.event = { ...this.event, stats: { ...this.event.stats, ...data.stats } };
        }
        // Update other event properties if provided
        if (data.status) {
          this.event.status = data.status;
        }
      }
    });

    // Listen for auction ended events (show to all users)
    console.log('Setting up auction:ended subscription...');
    this.auctionEndedSubscription = this.socketService.onAuctionEnded().subscribe({
      next: (data: any) => {
        console.log('✅ LiveAuctionComponent: Auction ended event received:', data);
        // Show thank you animation to all users
        this.auctionEndedData = data;
        this.showThankYouAnimation = true;
        console.log('✅ showThankYouAnimation set to:', this.showThankYouAnimation);
        // Update event status
        if (this.event) {
          this.event.status = 'completed';
        }
        // Stop timers and subscriptions
        this.countdownSubscription?.unsubscribe();
        this.playerTimerSubscription?.unsubscribe();
      },
      error: (error: any) => {
        console.error('❌ Error in auction:ended subscription:', error);
      },
      complete: () => {
        console.log('Auction ended subscription completed');
      }
    });

    // Listen for bid received events (real-time updates)
    this.bidReceivedSubscription = this.socketService.onBidReceived().subscribe((bidData: any) => {
      if (this.currentPlayer && bidData.playerId === this.currentPlayer._id) {
        // Update current bid information
        this.currentBidAmount = bidData.amount;
        this.winningTeam = {
          _id: bidData.teamId,
          name: bidData.teamName,
          shortName: bidData.teamShortName
        };
        
        // Check if current user is the winning bidder
        this.isCurrentWinningBidder = this.isTeamOwner() && (
          bidData.bidderId === this.currentUser._id || 
          bidData.teamId === this.currentUser.teamId ||
          (this.currentUser.team && bidData.teamId === this.currentUser.team._id)
        );
        
        // Update next bid amount (bid increment is ₹50)
        const bidIncrement = this.event?.settings?.bidIncrement || 50;
        this.nextBidAmount = bidData.amount + bidIncrement;
        
        // Update bid amount input to next increment (readonly, auto-set)
        if (this.isTeamOwner()) {
          this.bidAmount = this.nextBidAmount;
        }
        
        // Reset timer when bid is received (20 seconds after first bid)
        if (bidData.timerReset) {
          this.playerStartTime = new Date();
          this.startPlayerTimer(); // Will use 20 seconds
          console.log('Timer reset after bid received - 20 seconds');
        }
        
        // Show notification if not your own bid
        if (bidData.bidderId !== this.currentUser._id) {
          this.notificationService.info(`${bidData.teamName} placed a bid of ₹${bidData.amount.toLocaleString()}`);
        }
      }
    });

    // Listen for player update events (when admin starts new player auction)
    this.playerUpdateSubscription = this.socketService.onPlayerUpdate().subscribe((playerData: any) => {
      if (playerData.playerId) {
        // Update current player
        this.currentPlayer = playerData.player;
        this.currentBidAmount = playerData.currentBidAmount || playerData.player.basePrice;
        const bidIncrement = this.event?.settings?.bidIncrement || 50;
        this.nextBidAmount = this.currentBidAmount + bidIncrement;
        this.winningTeam = playerData.currentBid?.teamId ? {
          _id: playerData.currentBid.teamId,
          name: playerData.currentBid.teamName
        } : null;
        
        // Update bid amount input (readonly, auto-set to next bid)
        if (this.isTeamOwner()) {
          this.bidAmount = this.nextBidAmount;
        }
        
        // Check if current user is the winning bidder
        this.isCurrentWinningBidder = this.isTeamOwner() && playerData.currentBid && (
          playerData.currentBid.teamId === this.currentUser.teamId ||
          (this.currentUser.team && playerData.currentBid.teamId === this.currentUser.team._id)
        );
        
        // Start timer - use startTime from server or current time
        // Timer: 20 seconds before first bid, 20 seconds after first bid
        if (playerData.startTime) {
          this.playerStartTime = new Date(playerData.startTime);
        } else {
          // If no startTime provided, use current time
          this.playerStartTime = new Date();
        }
        this.startPlayerTimer(); // Will use 20s timer
        
        this.notificationService.info(`New player on auction: ${playerData.player.name}`);
      } else {
        // No current player
        this.currentPlayer = null;
        this.currentBidAmount = 0;
        this.nextBidAmount = 0;
        this.winningTeam = null;
        this.isCurrentWinningBidder = false;
        this.isCurrentWinningBidder = false;
        this.playerStartTime = null;
        this.playerAuctionTimer = 20;
        this.playerTimerSubscription?.unsubscribe();
      }
    });

    // Listen for player sold events
    this.playerSoldSubscription = this.socketService.onPlayerSold().subscribe((soldData: any) => {
      console.log('Player sold event received:', soldData);
      this.soldAnimationData = soldData;
      this.playerTimerSubscription?.unsubscribe();
      this.playerStartTime = null;
      
      // Check if current user's team bought the player - balance will be updated via socket
      if (this.isTeamOwner() && soldData.team && soldData.team._id) {
        const teamId = this.currentUser.teamId || (this.currentUser.team && this.currentUser.team._id);
        if (teamId && soldData.team._id === teamId) {
          console.log('Player sold to your team - waiting for balance update via socket');
          // Balance will be updated via team:balance socket event
          // The backend will emit the updated balance after the purchase
        }
      }
      
      // Clear current player after animation
      setTimeout(() => {
        this.currentPlayer = null;
        this.currentBidAmount = 0;
        this.nextBidAmount = 0;
        this.winningTeam = null;
        this.isCurrentWinningBidder = false;
        // Available players will be updated via socket players:available event
        
        // Auto-start next player if enabled and admin
        if (this.autoStartEnabled && this.isAdmin() && this.availablePlayers.length > 0) {
          // Small delay before auto-starting next player
          setTimeout(() => {
            this.autoStartNextPlayer();
          }, 1000);
        }
      }, 5500);
    });

    // Listen for player unsold events
    this.playerUnsoldSubscription = this.socketService.onPlayerUnsold().subscribe((unsoldData: any) => {
      this.unsoldAnimationData = unsoldData;
      this.playerTimerSubscription?.unsubscribe();
      this.playerStartTime = null;
      
      // Clear current player after animation
      setTimeout(() => {
        this.currentPlayer = null;
        this.currentBidAmount = 0;
        this.nextBidAmount = 0;
        this.winningTeam = null;
        this.isCurrentWinningBidder = false;
        // Available players will be updated via socket players:available event
        
        // Auto-start next player if enabled and admin
        if (this.autoStartEnabled && this.isAdmin() && this.availablePlayers.length > 0) {
          // Small delay before auto-starting next player
          setTimeout(() => {
            this.autoStartNextPlayer();
          }, 1000);
        }
      }, 5500);
    });
  }

  startPlayerTimer(): void {
    this.playerTimerSubscription?.unsubscribe();
    
    // Timer: 20 seconds before first bid, 20 seconds after first bid
    const timerDuration = 20; // Always 20 seconds
    
    if (!this.playerStartTime) {
      this.playerAuctionTimer = timerDuration;
      return;
    }

    // Calculate initial timer value
    const elapsed = Math.floor((new Date().getTime() - new Date(this.playerStartTime).getTime()) / 1000);
    this.playerAuctionTimer = Math.max(0, timerDuration - elapsed);

    this.playerTimerSubscription = interval(1000).subscribe(() => {
      if (!this.playerStartTime) {
        this.playerAuctionTimer = timerDuration;
        return;
      }

      const elapsed = Math.floor((new Date().getTime() - new Date(this.playerStartTime).getTime()) / 1000);
      this.playerAuctionTimer = Math.max(0, timerDuration - elapsed);

      if (this.playerAuctionTimer <= 0) {
        // Timer expired - backend should handle finalization
        // Stop the timer subscription
        this.playerTimerSubscription?.unsubscribe();
        // Note: Backend timer callback will handle the finalization and emit socket events
        // Frontend will receive player:sold or player:current event for next player
      }
    });
  }

  // Removed loadCurrentPlayer() - now using socket player:current event
  // Removed loadAvailablePlayers() - now using socket players:available event

  startRefreshing(): void {
    // No longer needed - using Socket.io for real-time updates
    // Keeping this method for backwards compatibility but not using polling
  }

  checkAuctionStatus(): void {
    if (!this.event) return;
    
    // Validate startDate before using it
    if (this.event.startDate) {
      const startDateObj = new Date(this.event.startDate);
      if (isNaN(startDateObj.getTime())) {
        console.error('Invalid startDate in event:', this.event.startDate);
      }
    }
    
    this.isAuctionStarted = this.event.status === 'live';
  }

  startCountdown(): void {
    if (!this.event) return;

    // Unsubscribe from previous countdown if exists
    this.countdownSubscription?.unsubscribe();

    this.countdownSubscription = interval(1000).subscribe(() => {
      if (!this.event || !this.event.startDate) {
        // If event or startDate is not available, show default message
        this.timeRemainingParts = [{ label: 'Seconds', value: '00' }];
        this.timeRemaining = 'Waiting for event data...';
        return;
      }

      const now = new Date().getTime();
      const startDateObj = new Date(this.event.startDate);
      const startDate = startDateObj.getTime();

      // Check if startDate is valid
      if (isNaN(startDate)) {
        console.error('Invalid startDate:', this.event.startDate);
        this.timeRemainingParts = [{ label: 'Seconds', value: '00' }];
        this.timeRemaining = 'Invalid start date';
        return;
      }

      const diff = startDate - now;

      if (diff <= 0 || this.event.status === 'live') {
        if (this.event.status !== 'live') {
          // Event data will be updated via socket event:update event
        }
        this.isAuctionStarted = true;
        this.timeRemaining = 'Auction Started!';
        this.timeRemainingParts = [];
        // Connect to socket and load data if not already done
        if (!this.socketService.isConnected()) {
          this.socketService.connect();
          this.socketService.joinAuction(this.eventId);
          this.setupSocketListeners();
        }
        // Current player will be updated via socket player:current event
        // Available players will be updated via socket players:available event
        return;
      }

      // Calculate time remaining (ensure all values are valid numbers)
      const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      // Validate all values are numbers
      if (isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error('Invalid time calculation:', { days, hours, minutes, seconds, diff, startDate, now });
        this.timeRemainingParts = [{ label: 'Seconds', value: '00' }];
        this.timeRemaining = 'Calculating...';
        return;
      }

      // Build time remaining parts for display
      this.timeRemainingParts = [];
      if (days > 0) {
        this.timeRemainingParts.push({ label: 'Days', value: String(days).padStart(2, '0') });
      }
      if (hours > 0 || days > 0) {
        this.timeRemainingParts.push({ label: 'Hours', value: String(hours).padStart(2, '0') });
      }
      if (minutes > 0 || hours > 0 || days > 0) {
        this.timeRemainingParts.push({ label: 'Minutes', value: String(minutes).padStart(2, '0') });
      }
      this.timeRemainingParts.push({ label: 'Seconds', value: String(seconds).padStart(2, '0') });

      // Also keep string format
      if (days > 0) {
        this.timeRemaining = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        this.timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        this.timeRemaining = `${minutes}m ${seconds}s`;
      } else {
        this.timeRemaining = `${seconds}s`;
      }
    });
  }

  startPlayerAuction(): void {
    if (!this.selectedPlayerId && !this.isRandomMode) {
      this.notificationService.error('Please select a player to start auction');
      return;
    }

    let playerIdToStart = this.selectedPlayerId;

    // If random mode, select a random available player
    if (this.isRandomMode) {
      const randomIndex = Math.floor(Math.random() * this.availablePlayers.length);
      playerIdToStart = this.availablePlayers[randomIndex]._id!;
    }

    if (!playerIdToStart) {
      this.notificationService.error('No player available to start auction');
      return;
    }

    const selectedPlayer = this.availablePlayers.find(p => p._id === playerIdToStart);
    const playerName = selectedPlayer?.name || 'selected player';

    this.confirmationService.confirm({
      header: 'Start Player Auction',
      message: this.isRandomMode 
        ? `Start auction for random player: ${playerName}?`
        : `Are you sure you want to start auction for ${playerName}?`,
      acceptLabel: 'Start',
      rejectLabel: 'Cancel'
    }).then((accepted: boolean) => {
      if (accepted) {
        this.isLoading = true;
        this.socketService.startPlayerAuction(this.eventId, playerIdToStart).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              this.notificationService.success(`Player auction started for ${playerName}!`);
              this.selectedPlayerId = '';
              this.isRandomMode = false;
              // Player update will come via socket player:current event
            } else {
              this.notificationService.error(response.error || 'Failed to start player auction');
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.error(error.error || 'Failed to start player auction');
          }
        });
      }
    });
  }

  startRandomPlayer(): void {
    this.isRandomMode = true;
    this.selectedPlayerId = '';
    this.startPlayerAuction();
  }

  placeBid(): void {
    if (!this.currentPlayer) {
      this.notificationService.error('No player is currently on auction');
      return;
    }

    if (this.bidAmount <= 0) {
      this.notificationService.error('Please enter a valid bid amount');
      return;
    }

    if (this.nextBidAmount && this.bidAmount < this.nextBidAmount) {
      this.notificationService.error(`Minimum bid is ₹${this.nextBidAmount.toLocaleString()}`);
      return;
    }

    this.isPlacingBid = true;
    this.socketService.submitBid(this.eventId, this.currentPlayer._id!, this.bidAmount).subscribe({
      next: (response) => {
        this.isPlacingBid = false;
        if (response.success) {
          this.notificationService.success(`Bid of ₹${this.bidAmount.toLocaleString()} placed successfully!`);
          // Bid update will come via socket bid:received event
          // Team balance will come via socket team:balance event
          // Update bid amount to next increment
          if (this.nextBidAmount) {
            this.bidAmount = this.nextBidAmount;
          }
        } else {
          this.notificationService.error(response.error || 'Failed to place bid');
        }
      },
      error: (error) => {
        this.isPlacingBid = false;
        this.notificationService.error(error.error || 'Failed to place bid');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isTeamOwner(): boolean {
    return this.currentUser?.role === 'team_owner';
  }

  loadTeamBalance(): void {
    // First check if team data is already in currentUser from login
    if (this.currentUser?.team?.budget !== undefined && this.currentUser?.team?.budget !== null) {
      const teamBudget = this.currentUser.team.budget || 0;
      const teamSpent = this.currentUser.team.spent || 0;
      const teamRemaining = this.currentUser.team.remainingBudget;
      
      // Use remainingBudget if available, otherwise calculate
      this.teamBalance = teamRemaining !== undefined && teamRemaining !== null
        ? teamRemaining
        : Math.max(0, teamBudget - teamSpent);
      
      console.log('Team balance from user data:', {
        budget: teamBudget,
        spent: teamSpent,
        remainingBudget: teamRemaining,
        calculatedBalance: this.teamBalance
      });
      
      return;
    }
    
    // Get teamId from currentUser - ensure it's a string
    let teamId: string | undefined;
    
    // Check if teamId is a string or object
    if (this.currentUser?.teamId) {
      teamId = typeof this.currentUser.teamId === 'string' 
        ? this.currentUser.teamId 
        : (this.currentUser.teamId as any)?._id || (this.currentUser.teamId as any)?.toString();
    }
    
    // If teamId not found, check team._id
    if (!teamId && this.currentUser?.team?._id) {
      teamId = typeof this.currentUser.team._id === 'string'
        ? this.currentUser.team._id
        : (this.currentUser.team._id as any)?.toString();
    }
    
    if (!teamId) {
      console.warn('Team ID not found for user', this.currentUser);
      this.teamBalance = null;
      return;
    }

    // Ensure teamId is a string
    teamId = String(teamId);
    console.log('Loading team balance for teamId:', teamId);
    
    this.teamService.getTeamById(teamId).subscribe({
      next: (response) => {
        console.log('Team data received:', response.data);
        if (response.success && response.data) {
          // Use remainingBudget if available, otherwise calculate from budget - spent
          const team = response.data;
          this.teamBalance = team.remainingBudget !== undefined && team.remainingBudget !== null
            ? team.remainingBudget
            : (team.budget || 0) - (team.spent || 0);
          
          // Ensure balance is not negative
          this.teamBalance = Math.max(0, this.teamBalance);
          
          console.log('Team balance calculated:', {
            budget: team.budget,
            spent: team.spent,
            remainingBudget: team.remainingBudget,
            finalBalance: this.teamBalance
          });
          
          // Update currentUser team data for consistency
          if (this.currentUser) {
            if (!this.currentUser.team) {
              this.currentUser.team = {};
            }
            this.currentUser.team.remainingBudget = this.teamBalance;
            this.currentUser.team.budget = team.budget || 0;
            this.currentUser.team.spent = team.spent || 0;
          }
        }
      },
      error: (error) => {
        console.error('Failed to load team balance:', error);
        // Fallback to stored balance or team budget
        const storedBalance = this.currentUser?.team?.remainingBudget;
        const storedBudget = this.currentUser?.team?.budget;
        this.teamBalance = storedBalance !== undefined && storedBalance !== null
          ? storedBalance
          : (storedBudget || 0);
        console.log('Using fallback balance:', this.teamBalance);
      }
    });
  }

  getTeamBalance(): number {
    // Use the updated teamBalance if it has been loaded, otherwise fallback to stored value
    return this.teamBalance !== null ? this.teamBalance : (this.currentUser?.team?.remainingBudget || 0);
  }

  isCurrentPlayer(playerId: string | undefined): boolean {
    return !!playerId && !!this.currentPlayer?._id && this.currentPlayer._id === playerId;
  }

  getSelectablePlayers(): Player[] {
    if (!this.currentPlayer?._id) {
      return this.availablePlayers;
    }
    return this.availablePlayers.filter((p: Player) => p._id !== this.currentPlayer?._id);
  }

  /**
   * Auto-start next player based on role sequence (batsman -> bowler -> all-rounder)
   */
  autoStartNextPlayer(): void {
    if (!this.isAdmin() || this.availablePlayers.length === 0 || this.currentPlayer) {
      return;
    }

    // Wait a bit for available players to update
    setTimeout(() => {
      if (this.availablePlayers.length === 0) {
        return;
      }

      // Get players grouped by role
      const batsmen = this.availablePlayers.filter(p => p.role === 'batsman');
      const bowlers = this.availablePlayers.filter(p => p.role === 'bowler');
      const allRounders = this.availablePlayers.filter(p => p.role === 'all-rounder');

      // Determine which category to use based on event's currentCategory
      let playersToChoose: Player[] = [];
      
      // Try to get current category from event, default to batsman
      const currentCategory = (this.event as any)?.currentCategory || 'batsman';
      
      if (currentCategory === 'batsman' && batsmen.length > 0) {
        playersToChoose = batsmen;
      } else if (currentCategory === 'bowler' && bowlers.length > 0) {
        playersToChoose = bowlers;
      } else if (currentCategory === 'all-rounder' && allRounders.length > 0) {
        playersToChoose = allRounders;
      } else {
        // Fallback: try batsman, then bowler, then all-rounder
        if (batsmen.length > 0) {
          playersToChoose = batsmen;
        } else if (bowlers.length > 0) {
          playersToChoose = bowlers;
        } else if (allRounders.length > 0) {
          playersToChoose = allRounders;
        } else {
          // If no players in any category, use all available
          playersToChoose = this.availablePlayers;
        }
      }

      if (playersToChoose.length > 0) {
        // Sort by basePrice ascending and select first
        const sortedPlayers = playersToChoose.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
        const nextPlayerId = sortedPlayers[0]._id!;
        
        // Auto-start the next player
        this.selectedPlayerId = nextPlayerId;
        this.startPlayerAuction();
      }
    }, 500); // Wait 500ms for available players to update
  }

  toggleAutoStart(): void {
    this.autoStartEnabled = !this.autoStartEnabled;
    // Save to localStorage
    localStorage.setItem('auctionAutoStart', String(this.autoStartEnabled));
    
    if (this.autoStartEnabled) {
      this.notificationService.success('Auto-start enabled. Next player will start automatically.');
    } else {
      this.notificationService.info('Auto-start disabled. You will need to manually start each player.');
    }
  }
}
