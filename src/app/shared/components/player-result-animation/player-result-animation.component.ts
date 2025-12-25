import { Component, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../../core/services/image.service';

export interface PlayerSoldData {
  player: {
    _id: string;
    name: string;
    role: string;
    photo: string | null;
    basePrice: number;
    soldPrice: number;
  };
  team: {
    _id: string;
    name: string;
    shortName: string;
    logo: string | null;
  };
  owner: {
    _id: string;
    name: string;
    email: string;
    photo: string | null;
  } | null;
  bidAmount: number;
}

export interface PlayerUnsoldData {
  player: {
    _id: string;
    name: string;
    role: string;
    photo: string | null;
    basePrice: number;
  };
}

@Component({
  selector: 'app-player-result-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-result-animation.component.html',
  styleUrls: ['./player-result-animation.component.scss']
})
export class PlayerResultAnimationComponent implements OnDestroy, OnChanges {
  @Input() soldData: PlayerSoldData | null = null;
  @Input() unsoldData: PlayerUnsoldData | null = null;
  
  showAnimation = false;
  private animationTimeout?: ReturnType<typeof setTimeout>;

  constructor(public imageService: ImageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Only show if there's actual data
    if (this.soldData || this.unsoldData) {
      this.showAnimation = true;
      // Auto-hide after 6 seconds
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
      }
      this.animationTimeout = setTimeout(() => {
        this.hideAnimation();
      }, 6000);
    } else {
      this.showAnimation = false;
    }
  }

  hideAnimation(): void {
    this.showAnimation = false;
    this.soldData = null;
    this.unsoldData = null;
  }

  ngOnDestroy(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }

  get isSold(): boolean {
    return !!this.soldData;
  }

  get isUnsold(): boolean {
    return !!this.unsoldData;
  }
}

