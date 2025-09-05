import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgentSidebarComponent } from '../agent-sidebar/agent-sidebar.component';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AgentSidebarComponent],
  templateUrl: './agent-layout.component.html',
  styleUrls: ['./agent-layout.component.scss']
})
export class AgentLayoutComponent {
  @Input() pageTitle: string = 'Agent Dashboard';
  @Input() pageIcon: string = 'fas fa-home';
  @Input() showHeaderActions: boolean = true;
  
  isSidebarCollapsed: boolean = false;
  isMobileSidebarOpen: boolean = false;
  
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }
  
  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }
}