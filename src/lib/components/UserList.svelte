<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '../stores/userStore.js';

	interface User {
		id: string;
		username: string;
		permissionLevel: number;
		createdAt: string;
		updatedAt: string;
	}

	let users: User[] = [];
	let isLoading = true;
	let error = '';
	let updateError = '';

	$: currentUserLevel = $user.permissionLevel;

	onMount(async () => {
		await fetchUsers();
	});

	async function fetchUsers() {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				error = 'Authentication required';
				isLoading = false;
				return;
			}

			const response = await fetch('/api/auth/users', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Error: ${response.status}`);
			}

			users = await response.json();
			isLoading = false;
		} catch (err) {
			console.error('Error fetching users:', err);
			error = err instanceof Error ? err.message : 'Failed to load users';
			isLoading = false;
		}
	}

	async function updatePermission(userId: string, newLevel: number) {
		updateError = '';
    
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				updateError = 'Authentication required';
				return;
			}

			const response = await fetch('/api/auth/permissions', {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					permissionLevel: newLevel
				})
			});

			const data = await response.json();
      
			if (!response.ok) {
				throw new Error(data.message || `Error: ${response.status}`);
			}
      
			// Refresh user list
			await fetchUsers();
		} catch (err) {
			console.error('Error updating permission:', err);
			updateError = err instanceof Error ? err.message : 'Failed to update permission';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	// get available permission based on current user's level
	function getPermissionOptions(currentLevel: number): number[] {
		// If user is level 10, they can set any level
		if (currentLevel === 10) {
			return Array.from({ length: 10 }, (_, i) => i + 1);
		}
		// If user is level 9, they can only set levels 1-8
		else if (currentLevel === 9) {
			return Array.from({ length: 8 }, (_, i) => i + 1);
		}
		// else return empty array
		return [];
	}

	// type-safe handler for the select change
	function handlePermissionChange(userId: string, event: Event) {
		const select = event.target as HTMLSelectElement;
		const newLevel = parseInt(select.value);
		updatePermission(userId, newLevel);
	}

	// Determine if the current user can edit a specific user's permissions
	function canEditUser(targetUserLevel: number): boolean {
		// Level 10 users can edit anyone except themselves
		if (currentUserLevel === 10) {
			return true;
		}
		// Level 9 users can only edit users with level 8 or below
		else if (currentUserLevel === 9) {
			return targetUserLevel < 9;
		}
		return false;
	}
</script>

<div class="glass page-component max-w-3xl mx-auto">
	<h2 class="important-text mb-4">User Management</h2>

	{#if updateError}
		<div class="error-message mb-4 p-2 text-center">{updateError}</div>
	{/if}

	{#if isLoading}
		<div class="text-center py-4">Loading users...</div>
	{:else if error}
		<div class="error-message text-center py-4">{error}</div>
	{:else}
		<table class="w-full">
			<thead>
				<tr class="border-b border-gray-700">
					<th class="text-left p-2 w-1/2">Username</th>
					<th class="text-left p-2 w-1/6">Permission</th>
					<th class="text-left p-2 w-1/3">Created</th>
				</tr>
			</thead>
			<tbody>
				{#each users as userData}
					<tr class="border-b border-gray-700">
						<td class="p-2 w-1/2">{userData.username}</td>
						<td class="p-2 w-1/6">
							{#if userData.id !== $user.id && canEditUser(userData.permissionLevel)}
								<select 
									class="dark-textarea py-1 px-2 w-full"
									value={userData.permissionLevel}
									on:change={(e) => handlePermissionChange(userData.id, e)}
								>
									{#each getPermissionOptions(currentUserLevel) as level}
										<option value={level}>{level}</option>
									{/each}
								</select>
							{:else}
								{userData.permissionLevel}
							{/if}
						</td>
						<td class="p-2 w-1/3">{formatDate(userData.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
