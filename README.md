# Tech EcoLab - Computer Store

A modern, responsive tech store built with vanilla JavaScript and PostgreSQL, featuring a clean design with smooth animations and a muted color palette.

## Features

- 🖥️ **Product Catalog**: Browse desktops, laptops, monitors, cables, peripherals, and more
- 🔍 **Search & Filter**: Find products by name, category, and price
- 🛒 **Shopping Cart**: Add/remove items with persistent local storage
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- ✨ **Smooth Animations**: Modern UI with subtle transitions and hover effects
- 🎨 **Modern Styling**: Clean, professional design with muted colors
- 🗄️ **PostgreSQL Backend**: Robust database for product management

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tech-ecolab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb tech_ecolab
   
   # Run the SQL script to create tables and sample data
   psql -d tech_ecolab -f database.sql
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=tech_ecolab
   DB_PASSWORD=your_password_here
   DB_PORT=5432
   PORT=3000
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-restart (Express + PostgreSQL)
   npm run dev

   # Production mode (Express + PostgreSQL)
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
tech-ecolab/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── script.js           # Frontend JavaScript
├── server.js               # Express server
├── database.sql            # Database schema and sample data
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products (supports category, search, sort filters)
- `GET /api/products/:id` - Get specific product details
- `GET /api/categories` - Get all product categories

### Admin Endpoints (Authentication Required)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Check authentication status
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## Admin Access

The application includes a complete admin interface for product management:

1. **Admin Login**: Navigate to `/admin-login.html`
   - Username: `admin`
   - Password: `admin123`

2. **Admin Dashboard**: After login, access the dashboard at `/admin-dashboard.html`
   - View product statistics
   - Manage products (Create, Read, Update, Delete)
   - Search and filter products
   - Real-time updates

## Features Overview

### Product Catalog
- Grid layout with product cards
- Category-based filtering
- Search functionality
- Price sorting (low to high, high to low)
- Responsive design for all screen sizes

### Shopping Cart
- Add/remove items
- Quantity management
- Persistent storage using localStorage
- Real-time cart count updates
- Modal-based cart interface

### Modern UI/UX
- Smooth animations and transitions
- Hover effects and micro-interactions
- Clean, professional design
- Muted color palette (blues, grays, accent colors)
- Mobile-first responsive design

## Database Schema

The application uses two main tables:

- **categories**: Product categories (Desktops, Laptops, etc.)
- **products**: Product information with specifications stored as JSONB

## Customization

### Adding New Products
1. Add products directly to the database using SQL
2. Or create an admin interface to manage products

### Styling
- Modify `public/styles.css` for custom styling
- Color scheme can be easily changed by updating CSS variables
- Animations can be adjusted in the CSS animations section

### Features
- Add user authentication
- Implement checkout process
- Add product reviews and ratings
- Create admin dashboard
- Add inventory management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
