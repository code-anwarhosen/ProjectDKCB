/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
// npx tailwindcss -i ./css/input.css -o ./css/tailwind.css
// docker run -d -p 1100:80 --name ProjectDKCB -v ./:/usr/share/nginx/html:ro --restart unless-stopped nginx:alpine