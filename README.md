    # 🖥️ LaptopGuru - Intelligent Laptop Comparison Platform

    A full-stack web application that helps users find the perfect laptop through AI-powered recommendations, detailed comparisons, and smart filtering. Built with React + TypeScript frontend and Node.js backend.

    ## 🌟 Features

    ### 🤖 AI-Powered Assistant

    - **LaptopGuru Chatbot**: Get personalized laptop recommendations based on your needs
    - **Smart Recommendations**: AI analyzes your requirements and suggests the best laptops
    - **Natural Language Queries**: Ask questions in plain English

    ### 🔍 Advanced Search & Filter

    - **Multi-criteria Filtering**: Brand, price range, RAM, storage, processor, and more
    - **Smart Search**: Find laptops by specifications or use cases
    - **Real-time Results**: Instant filtering with responsive UI

    ### ⚖️ Detailed Comparisons

    - **Side-by-Side Analysis**: Compare up to multiple laptops simultaneously
    - **Comprehensive Specs**: Detailed technical specifications and features
    - **Price Comparison**: Cross-platform pricing from Amazon and Flipkart

    ### 👤 User Experience

    - **User Authentication**: Secure login and registration system
    - **Personalized History**: Track your viewed and compared laptops
    - **Favorites System**: Save laptops for later review
    - **Responsive Design**: Optimized for desktop, tablet, and mobile

    ### 📊 Rich Data

    - **Extensive Database**: 1000+ laptop models with detailed specifications
    - **Real-time Pricing**: Updated prices from major e-commerce platforms
    - **User Reviews**: Community-driven laptop reviews and ratings

    ## 🏗️ Architecture

    ### Frontend (Client)

    - **Framework**: React 19 with TypeScript
    - **Build Tool**: Vite for fast development and optimized builds
    - **Styling**: TailwindCSS for modern, responsive design
    - **Routing**: React Router v7 for client-side navigation
    - **AI Integration**: Google Generative AI for chatbot functionality

    ### Backend (Server)

    - **Runtime**: Node.js with Express.js
    - **Database**: MongoDB with Mongoose ODM
    - **Authentication**: Passport.js with local strategy
    - **Data Processing**: CSV parsing and JSON data handling
    - **Cross-Origin**: CORS enabled for frontend-backend communication

    ## 🚀 Quick Start

    ### Prerequisites

    - Node.js (v16 or higher)
    - MongoDB (local installation or MongoDB Atlas)
    - Git

    ### 1. Clone the Repository

    ```bash
    git clone https://github.com/yourusername/laptop-comparison.git
    cd laptop-comparison
    ```

    ### 2. Install Dependencies

    ```bash
    # Install root dependencies
    npm install

    # Install client dependencies
    cd client
    npm install

    # Install server dependencies
    cd ../server
    npm install
    ```

    ### 3. Environment Configuration

    #### Server Environment Variables

    Create `.env` file in the `server` directory:

    ```env
    # Database Configuration
    MONGODB_URI=mongodb://localhost:27017/laptop-comparison
    # or for MongoDB Atlas:
    # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laptop-comparison

    # Server Configuration
    PORT=8080
    NODE_ENV=development

    # Session Configuration
    SESSION_SECRET=your-super-secret-session-key-here

    # Optional: AI Service Keys (if using extended AI features)
    GOOGLE_AI_API_KEY=your-google-ai-api-key
    ```

    #### Client Environment Variables

    Create `.env` file in the `client` directory:

    ```env
    # API Configuration
    VITE_API_BASE_URL=http://localhost:8080

    # Google AI Configuration (for chatbot)
    VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key

    # Environment
    VITE_NODE_ENV=development
    ```

    ### 4. Database Setup

    ```bash
    # Make sure MongoDB is running locally, or use MongoDB Atlas

    # The application will automatically populate the database with laptop data on first run
    ```

    ### 5. Start the Application

    ```bash
    # Option 1: Start both client and server together (from root directory)
    npm run dev

    # Option 2: Start client and server separately
    # Terminal 1 - Start server
    cd server
    npm run dev

    # Terminal 2 - Start client
    cd client
    npm run dev
    ```

    ### 6. Access the Application

    - **Frontend**: http://localhost:5173
    - **Backend API**: http://localhost:8080

    ## 📁 Project Structure

    ```
    laptop-comparison/
    ├── client/                          # React TypeScript Frontend
    │   ├── public/                      # Static assets
    │   ├── src/
    │   │   ├── components/              # Reusable UI components
    │   │   │   ├── Header/             # Navigation header
    │   │   │   ├── Footer/             # Site footer
    │   │   │   ├── LaptopCard/         # Laptop display cards
    │   │   │   ├── Filter/             # Search and filter components
    │   │   │   └── Comparison/         # Laptop comparison components
    │   │   ├── pages/                  # Page-level components
    │   │   │   ├── home/               # Homepage
    │   │   │   ├── search/             # Search and filter page
    │   │   │   ├── compare/            # Laptop comparison page
    │   │   │   ├── chatbot/            # AI chatbot interface
    │   │   │   ├── signin.tsx          # User authentication
    │   │   │   └── signup.tsx          # User registration
    │   │   ├── contexts/               # React contexts for state management
    │   │   │   ├── AuthContext.tsx     # User authentication state
    │   │   │   └── CompareContext.tsx  # Laptop comparison state
    │   │   ├── hooks/                  # Custom React hooks
    │   │   │   ├── useProducts.ts      # Laptop data fetching
    │   │   │   ├── useFavorites.ts     # User favorites management
    │   │   │   └── useHistory.ts       # User history tracking
    │   │   ├── services/               # API and external service integrations
    │   │   │   ├── geminiService.ts    # AI recommendation service
    │   │   │   └── geminiChatbotService.ts # AI chatbot service
    │   │   ├── types/                  # TypeScript type definitions
    │   │   │   ├── laptop.ts           # Laptop data types
    │   │   │   └── compare.ts          # Comparison-related types
    │   │   ├── utils/                  # Utility functions
    │   │   │   └── api.ts              # API configuration utilities
    │   │   └── App.tsx                 # Main application component
    │   ├── package.json                # Client dependencies
    │   └── vite.config.ts              # Vite configuration
    ├── server/                         # Node.js Express Backend
    │   ├── Data/                       # JSON data files
    │   │   ├── final_laptops.json      # Main laptop dataset
    │   │   └── matched_laptops.json    # Processed laptop matches
    │   ├── model/                      # MongoDB schemas
    │   │   ├── Laptop.js               # Laptop data model
    │   │   ├── users.js                # User authentication model
    │   │   └── Review.js               # User review model
    │   ├── utils/                      # Server utilities
    │   │   └── dataFill.js             # Data processing utilities
    │   ├── server.js                   # Main server application
    │   └── package.json                # Server dependencies
    ├── package.json                    # Root project configuration
    └── README.md                       # Project documentation
    ```

    ## 🛠️ Development

    ### Available Scripts

    #### Root Level

    ```bash
    npm run dev              # Start both client and server
    npm run start:client     # Start only client
    npm run start:server     # Start only server
    ```

    #### Client

    ```bash
    npm run dev              # Start development server
    npm run build            # Build for production
    npm run preview          # Preview production build
    npm run lint             # Run ESLint
    ```

    #### Server

    ```bash
    npm run dev              # Start with nodemon (auto-restart)
    npm start                # Start production server
    ```

    ### Code Style

    - **TypeScript**: Strict mode enabled for type safety
    - **ESLint**: Configured with React and TypeScript rules
    - **Prettier**: Code formatting (recommended)
    - **TailwindCSS**: Utility-first CSS framework

    ## 🚀 Deployment

    ### Frontend Deployment (Vercel)

    1. **Build Configuration**

    ```bash
    # From client directory
    npm run build
    ```

    2. **Environment Variables on Vercel**
    Set these environment variables in your Vercel dashboard:

    - `VITE_API_BASE_URL`: Your backend API URL
    - `VITE_GOOGLE_AI_API_KEY`: Google AI API key

    3. **Deploy**

    ```bash
    # Install Vercel CLI
    npm i -g vercel

    # Deploy from client directory
    cd client
    vercel --prod
    ```

    ### Backend Deployment Options

    #### Option 1: Railway

    1. Connect your GitHub repository
    2. Set environment variables
    3. Deploy the `server` directory

    #### Option 2: Heroku

    ```bash
    # From server directory
    git subtree push --prefix server heroku main
    ```

    #### Option 3: DigitalOcean App Platform

    1. Create new app from GitHub
    2. Set source directory to `server`
    3. Configure environment variables

    ### Database Deployment

    - **MongoDB Atlas**: Recommended for production
    - Update `MONGODB_URI` in production environment variables

    ## 🔧 Configuration

    ### Google AI API Setup

    1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
    2. Create a new API key
    3. Add to environment variables:
    - Client: `VITE_GOOGLE_AI_API_KEY`
    - Server: `GOOGLE_AI_API_KEY` (if needed)

    ### MongoDB Configuration

    - **Local Development**: `mongodb://localhost:27017/laptop-comparison`
    - **Production**: Use MongoDB Atlas connection string

    ### CORS Configuration

    Update CORS origins in `server/server.js` for production:

    ```javascript
    const corsOptions = {
    origin: [
        "http://localhost:5173", // Development
        "https://your-app.vercel.app", // Production
    ],
    credentials: true,
    };
    ```

    ## 📚 API Documentation

    ### Authentication Endpoints

    - `POST /register` - User registration
    - `POST /login` - User login
    - `POST /logout` - User logout
    - `GET /user` - Get current user

    ### Laptop Data Endpoints

    - `GET /api/laptops` - Get all laptops
    - `GET /api/laptops/search` - Search laptops with filters
    - `GET /api/laptops/:id` - Get specific laptop details

    ### User Data Endpoints

    - `GET /api/user/history` - Get user's laptop history
    - `POST /api/user/history` - Add laptop to history
    - `GET /api/user/favorites` - Get user's favorite laptops
    - `POST /api/user/favorites` - Add/remove laptop from favorites

    ## 🤝 Contributing

    1. Fork the repository
    2. Create a feature branch (`git checkout -b feature/amazing-feature`)
    3. Commit your changes (`git commit -m 'Add amazing feature'`)
    4. Push to the branch (`git push origin feature/amazing-feature`)
    5. Open a Pull Request

    ### Development Guidelines

    - Follow TypeScript best practices
    - Use meaningful commit messages
    - Add tests for new features
    - Update documentation as needed
    - Ensure responsive design for all new UI components

    ## 🐛 Troubleshooting

    ### Common Issues

    #### Build Errors

    ```bash
    # Clear node_modules and reinstall
    rm -rf node_modules package-lock.json
    npm install
    ```

    #### CORS Issues

    - Ensure backend CORS configuration includes your frontend URL
    - Check that credentials are properly configured

    #### Database Connection

    - Verify MongoDB is running (local) or connection string is correct (Atlas)
    - Check network connectivity and firewall settings

    #### Environment Variables

    - Ensure all required environment variables are set
    - Verify `.env` files are not committed to Git
    - Check variable naming (VITE\_ prefix for client-side variables)

    ## 📄 License

    This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

    ## 🙏 Acknowledgments

    - Google AI for generative AI capabilities
    - MongoDB for database services
    - React and TypeScript communities
    - TailwindCSS for excellent styling framework
    - All laptop manufacturers for product specifications

    ## 📞 Support

    If you have any questions or need help with setup, please:

    1. Check the troubleshooting section above
    2. Look through existing [GitHub Issues](https://github.com/yourusername/laptop-comparison/issues)
    3. Create a new issue with detailed information about your problem

    ---

    **Happy Coding! 🚀**

    Made with ❤️
