# Election Poll Backend

A Node.js/Express backend service for handling election poll voting, built with TypeScript and MongoDB.

## Features

- Real-time vote tracking system
- Geographic validation (US-only voting)
- Rate limiting for API endpoints
- Session-based duplicate vote prevention
- IP-based vote verification
- Demographic data collection (ethnicity and gender)
- Comprehensive error logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

## Environment Variables

Create a `.env` file in the root directory with the following variables:


## Running the Application

The application can be run in different environments:

Development mode with hot reload
yarn start:dev

Staging environment
yarn start:staging

Production environment
yarn start:prod

## API Endpoints

### GET /api/votes
- Returns current vote tally and user voting status
- Rate limit: 500 requests per minute

### POST /api/votes
- Casts a vote for a candidate
- Rate limit: 3 requests per 24 hours
- Required body parameters:
  - candidate: "kamala" | "trump"
  - voterEthnicity: string
  - voterGender: string

## Security Features

- CORS protection
- Rate limiting
- Cookie-based session management
- Geographic restriction (US-only)
- IP tracking
- Request validation

## Dependencies

- express
- mongoose
- winston (logging)
- cors
- cookie-parser
- express-rate-limit
- geoip-lite
- uuid
- typescript

## License

MIT