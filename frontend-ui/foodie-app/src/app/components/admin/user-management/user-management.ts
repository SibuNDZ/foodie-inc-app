import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { User, UserAdminUpdateRequest, UserRole } from '../../../models';
import { AuthService } from '../../../services/auth';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  protected readonly users = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly updatingUserId = signal<number | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<'ALL' | UserRole>('ALL');
  protected readonly activeFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  protected readonly roles = Object.values(UserRole);
  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly filteredUsers = computed(() => {
    const search = this.searchQuery().trim().toLowerCase();

    return this.users().filter((user) => {
      if (this.roleFilter() !== 'ALL' && user.role !== this.roleFilter()) {
        return false;
      }

      if (this.activeFilter() === 'ACTIVE' && user.isActive === false) {
        return false;
      }

      if (this.activeFilter() === 'INACTIVE' && user.isActive !== false) {
        return false;
      }

      if (search) {
        const haystack = `${user.username} ${user.email} ${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected refresh(): void {
    this.loadUsers();
  }

  protected isSelf(user: User): boolean {
    return this.currentUserId() === user.id;
  }

  protected updateRole(user: User, role: UserRole): void {
    if (this.isSelf(user)) {
      this.toastr.warning('You cannot change your own admin role.');
      return;
    }
    this.saveUser(user, { role });
  }

  protected updateActive(user: User, isActive: boolean): void {
    if (this.isSelf(user)) {
      this.toastr.warning('You cannot change your own active state.');
      return;
    }
    this.saveUser(user, { isActive });
  }

  protected deactivateUser(user: User): void {
    if (user.isActive === false) {
      return;
    }

    if (this.isSelf(user)) {
      this.toastr.warning('You cannot deactivate your own account.');
      return;
    }

    this.updatingUserId.set(user.id);
    this.userService.deactivateUser(user.id)
      .pipe(finalize(() => this.updatingUserId.set(null)))
      .subscribe({
        next: () => {
          this.users.update((current) => current.map((existing) =>
            existing.id === user.id ? { ...existing, isActive: false } : existing
          ));
          this.toastr.success(`User ${user.username} deactivated.`);
        },
        error: () => this.toastr.error('Unable to deactivate user right now.')
      });
  }

  private saveUser(user: User, patch: UserAdminUpdateRequest): void {
    this.updatingUserId.set(user.id);
    this.userService.updateUser(user.id, patch)
      .pipe(finalize(() => this.updatingUserId.set(null)))
      .subscribe({
        next: (updated) => {
          this.users.update((current) => current.map((existing) =>
            existing.id === updated.id ? updated : existing
          ));
          this.toastr.success(`User ${updated.username} updated.`);
        },
        error: () => this.toastr.error('Unable to update user right now.')
      });
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userService.getAllUsers()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => {
          this.users.set([]);
          this.errorMessage.set('Unable to load users right now.');
          this.toastr.error('Unable to load users right now.');
        }
      });
  }

}
