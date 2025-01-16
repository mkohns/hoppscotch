export const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Postboy Login</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
    />
    <style>
      body {
        background-color: #121212;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: Arial, sans-serif;
      }
      .logo-container {
        display: flex;
        align-items: center;
      }
      .logo {
        height: 100px; /* Adjust the height as needed */
        margin: 0 10px;
      }
      .connection-icon {
        font-size: 50px; /* Adjust the size as needed */
        margin: 0 20px;
        color: #ffffff;
      }
      h2 {
        margin-top: 20px;
        font-size: 1.2rem;
      }
    </style>
  </head>
  <body>
    <div class="logo-container">
      <img src="VITE_BACKEND_API_URL/files/logo" alt="Logo" class="logo" />
      <i class="fas fa-arrow-right-arrow-left connection-icon"></i>
      <img
        src="VITE_BACKEND_API_URL/files/henry"
        alt="Henry Logo"
        class="logo"
        style="scale: 1.2"
      />
    </div>
    <h2>Schaeffler Postboy is now connected to CASS</h2>
    <div>Thank you for using Postboy, API CoE Team</div>
    <script>
      function resizeImage() {
        const logos = document.querySelectorAll(".logo")
        logos.forEach((img) => {
          img.style.height = window.innerHeight * 0.3 + "px" // Adjust the height as needed
        })
        const connectionIcon = document.querySelector(".connection-icon")
        connectionIcon.style.fontSize = window.innerHeight * 0.1 + "px" // Adjust the size as needed
      }
      window.addEventListener("resize", resizeImage)
      window.addEventListener("load", resizeImage)
    </script>
  </body>
</html>
`
