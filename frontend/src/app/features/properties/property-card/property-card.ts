// src/app/features/properties/property-card/property-card.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyModel } from '../../../services/property';
import { UserService, BasicUserInfo } from '../../../services/user.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-card.html',
  styleUrl: './property-card.scss',
})
export class PropertyCard implements OnInit {
  @Input() property!: PropertyModel;

  agentInfo: BasicUserInfo | null = null;
  isLoadingAgent = true;

  constructor(public userService: UserService) {}

  ngOnInit() {
    this.loadAgentInfo();
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
}
