<?php
// dashboard.php
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resident Dashboard - Recycling Pickup Scheduler</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <div class="dashboard-wrapper">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="side-logo">
                    <img src="logo.png" alt="Logo">
                </div>
                <span class="brand-text">Recycling Pickup Scheduler</span>
            </div>

            <nav class="nav-menu">
                <a href="#" class="nav-link active">
                    <span class="icon">⊞</span> Dashboard
                </a>
                <a href="#" class="nav-link">
                    <span class="icon">✚</span> New Request
                </a>
                <a href="#" class="nav-link">
                    <span class="icon">📋</span> My Requests
                </a>
                <a href="#" class="nav-link">
                    <span class="icon">🔔</span> Notifications
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="user-profile">
                    <span class="user-name">John Resident</span>
                    <button class="btn-logout">Logout</button>
                </div>
            </header>

            <section class="welcome-banner">
                <h1>Welcome back, John!</h1>
                <p>Manage your recycling requests and track pickup schedules</p>
            </section>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <p class="stat-label">Total Requests</p>
                        <p class="stat-value">24</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <p class="stat-label">Pending</p>
                        <p class="stat-value">3</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <p class="stat-label">Approved</p>
                        <p class="stat-value">5</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <p class="stat-label">Completed</p>
                        <p class="stat-value">16</p>
                    </div>
                </div>
            </div>

            <!-- Dashboard Content -->
            <div class="dashboard-content-grid">
                <!-- Recent Requests -->
                <div class="content-card recent-requests">
                    <div class="card-header">
                        <h2>Recent Requests</h2>
                        <button class="btn-primary">+ New Request</button>
                    </div>

                    <div class="request-list">
                        <div class="request-item">
                            <div class="request-info">
                                <p class="req-id">REQ-001</p>
                                <p class="req-meta">Apr 12, 2026 • Plastic & Paper</p>
                            </div>
                            <span class="status-badge completed">Completed</span>
                        </div>

                        <div class="request-item">
                            <div class="request-info">
                                <p class="req-id">REQ-002</p>
                                <p class="req-meta">Apr 14, 2026 • Electronics</p>
                            </div>
                            <span class="status-badge pending">Pending</span>
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="content-card notifications-card">
                    <div class="card-header">
                        <h2>Notifications</h2>
                    </div>
                    <div class="notification-list">
                        <p class="notif-item">• Your request REQ-003 has been approved</p>
                        <p class="notif-item">• Pickup scheduled for Apr 15 at 10:00 AM</p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>

</html>