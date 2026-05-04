<?php
// login.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Recycling Pickup Scheduler</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <div class="login-container">
        <div class="login-box">

            <div class="logo-section">
                <div class="logo-box">
                    <img src="logo.png" alt="Recycling Pickup Scheduler Logo">
                </div>
            </div>

            <h1>Welcome to Recycling Pickup Scheduler</h1>
            <p class="subtitle">Sign in to manage your recycling requests</p>

            <form action="dashboard.php" method="POST">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required>
                </div>

                <div class="form-group">
                    <div class="label-wrapper">
                        <label for="password">Password</label>
                        <a href="#" class="forgot-link">Forgot Password?</a>
                    </div>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </div>

                <button type="submit" class="btn-login">Login</button>
            </form>

            <p class="signup-text">Don't have an account? <a href="#">Sign up</a></p>

            <div class="test-accounts">
                <p><strong>Test Accounts:</strong></p>
                <ul>
                    <li>• resident@test.com - Resident Dashboard</li>
                    <li>• admin@test.com - Admin Dashboard</li>
                    <li>• collector@test.com - Collector Dashboard</li>
                </ul>
            </div>

        </div>
    </div>
</body>
</html>