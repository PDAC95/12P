// src/app/features/properties/property-card/property-card.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyModel } from '../../../services/property';
import { UserService, BasicUserInfo } from '../../../services/user.service';
import { FavoriteButton } from '../../../shared/components/favorite-button/favorite-button';
import { ComparisonService } from '../../../services/comparison.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FavoriteButton],
  templateUrl: './property-card.html',
  styleUrl: './property-card.scss',
})
export class PropertyCard implements OnInit, OnDestroy {
  @Input() property!: PropertyModel;

  agentInfo: BasicUserInfo | null = null;
  isLoadingAgent = true;
  isSelectedForComparison = false;
  canAddToComparison = true;
  comparisonCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    public userService: UserService,
    private comparisonService: ComparisonService
  ) {}

  ngOnInit() {
    this.loadAgentInfo();
    this.initializeComparisonState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComparisonState() {
    // Subscribe to comparison state changes
    this.comparisonService.selectedProperties$
      .pipe(takeUntil(this.destroy$))
      .subscribe(properties => {
        this.isSelectedForComparison = this.comparisonService.isPropertySelected(this.property._id);
        this.comparisonCount = properties.length;
        this.canAddToComparison = this.comparisonService.canAddMore() || this.isSelectedForComparison;
      });
  }

  private loadAgentInfo() {
    if (!this.property.owner) {
      this.isLoadingAgent = false;
      return;
    }

    console.log(
      '👤 Loading agent info for property:',
      this.property.title,
      'Owner:',
      this.property.owner
    );

    this.userService.getBasicUserInfo(this.property.owner).subscribe({
      next: (agentInfo) => {
        this.agentInfo = agentInfo;
        this.isLoadingAgent = false;
        console.log('✅ Agent info loaded:', agentInfo);
      },
      error: (error) => {
        console.warn('⚠️ Failed to load agent info:', error);
        this.isLoadingAgent = false;
      },
    });
  }

  getAgentDisplayName(): string {
    if (!this.agentInfo) return 'Loading...';
    return this.agentInfo.fullName;
  }

  getAgentRoleIcon(): string {
    if (!this.agentInfo) return 'fas fa-user';

    switch (this.agentInfo.role) {
      case 'agent':
        return 'fas fa-home';
      case 'client':
        return 'fas fa-user';
      default:
        return 'fas fa-user';
    }
  }

  // Handle favorite change
  onFavoriteChanged(isFavorited: boolean) {
    // Ver el objeto completo para debug
    console.log('❤️ Property object:', this.property);
    console.log('❤️ All property keys:', Object.keys(this.property));
    console.log('❤️ Favorite status changed:', {
      propertyId: this.property.id,
      isFavorited: isFavorited,
    });
  }

  // Debug method to check what's happening with navigation
  onViewDetailsClick() {
    console.log('🔍 View Details clicked for property:', {
      id: this.property.id,
      title: this.property.title,
      navigateTo: `/properties/detail/${this.property.id}`,
    });
  }

  // Debug method for agent profile navigation
  onViewAgentClick() {
    console.log('👤 View Agent clicked for property:', {
      propertyId: this.property.id,
      propertyTitle: this.property.title,
      ownerId: this.property.owner,
      agentName: this.agentInfo?.fullName,
      navigateTo: `/user/${this.property.owner}`,
    });
  }

  // Handle compare button click
  onCompareClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    const success = this.comparisonService.toggleProperty(this.property);
    
    if (!success && !this.isSelectedForComparison) {
      // Show feedback that max items reached
      console.warn('Cannot add more properties to comparison. Maximum of 3 reached.');
    }
    
    console.log('🔄 Compare toggled for property:', {
      propertyId: this.property._id,
      title: this.property.title,
      isSelected: !this.isSelectedForComparison,
      totalSelected: this.comparisonService.getSelectedCount()
    });
  }

  // Get comparison button tooltip
  getCompareTooltip(): string {
    if (this.isSelectedForComparison) {
      return 'Remove from comparison';
    } else if (!this.canAddToComparison) {
      return 'Maximum 3 properties for comparison';
    } else {
      return `Add to comparison (${this.comparisonService.getCounterText()})`;
    }
  }

  // Get comparison button icon
  getCompareIcon(): string {
    return this.isSelectedForComparison ? 'fas fa-check-square' : 'far fa-square';
  }
}
