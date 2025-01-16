export const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OAuth Success</title>
    <style>
      body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #121212;
        color: #ffffff;
        font-family: Arial, sans-serif;
      }
      .logo-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .oauth-logo {
        width: 80%; /* Adjust the size as needed */
      }
      .postboy-logo {
        position: absolute;
        bottom: 10px;
        right: 60px;
        width: 20%; /* Adjust the size as needed */
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        background-color: rgba(255, 255, 255, 0.8);
        padding: 5px;
      }
      h2 {
        margin-top: 20px;
        font-size: 1.2rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="logo-container">
      <img
        src="VITE_BACKEND_API_URL/files/oauth"
        alt="OAuth2 Logo"
        class="oauth-logo"
      />
      <img
        src="VITE_BACKEND_API_URL/files/logo"
        alt="Postboy Logo"
        class="postboy-logo"
      />
    </div>
    <h2>OAuth2 Authorization Code Flow successful</h2>
    <div style="text-align: center">
      Thank you for using Postboy, API CoE Team
    </div>
  </body>
</html>`
