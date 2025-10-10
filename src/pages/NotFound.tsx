import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          
          <Card className="p-6 mb-8">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What happened?
            </h3>
            <p className="text-sm text-gray-600">
              The page you're looking for might have been moved, deleted, or doesn't exist.
            </p>
          </Card>

          <div className="space-y-4">
            <Link to="/dashboard">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            
            <div className="flex space-x-4">
              <Link to="/practice">
                <Button variant="outline" className="w-full">
                  Start Practice
                </Button>
              </Link>
              <Link to="/progress">
                <Button variant="outline" className="w-full">
                  View Progress
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              to="/dashboard" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
