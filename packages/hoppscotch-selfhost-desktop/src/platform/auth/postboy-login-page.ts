export const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Postboy Login</title>
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
      img {
        height: auto;
      }
      h2 {
        margin-top: 20px;
        font-size: 1.2rem;
      }
    </style>
  </head>
  <body>
    <img id="logo" src="VITE_BACKEND_API_URL/files/logo" alt="Logo" />
    <h2>Login to Schaeffler Postboy successful</h2>
    <div>Thank you for using Postboy, API CoE Team</div>
    <script>
      function resizeImage() {
        const img = document.getElementById("logo")
        img.style.height = window.innerHeight * 0.5 + "px"
      }
      window.addEventListener("resize", resizeImage)
      window.addEventListener("load", resizeImage)
    </script>
  </body>
</html>`
