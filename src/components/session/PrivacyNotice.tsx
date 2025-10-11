import React, { useState } from 'react'
import { Card } from '../ui/Card'
import Button from '../shared/ui/Button'
import { sessionStorage } from '../../services/sessionPersistence'

interface PrivacyNoticeProps {
  onAccept: () => void
  onDecline: () => void
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ onAccept, onDecline }) => {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAllData = async () => {
    setIsClearing(true)
    try {
      await sessionStorage.clearAllSensitiveData()
      alert('All your data has been cleared from this device.')
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('Failed to clear data. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔒 Privacy & Data Storage
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <p>
                <strong>Your data stays on your device.</strong> We use your browser's local storage 
                to save your interview progress so you can resume where you left off.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What we store locally:</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Your interview questions and answers</li>
                  <li>Job descriptions you provide</li>
                  <li>Your progress through interview sessions</li>
                  <li>Session timestamps and status</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">What we DON'T do:</h3>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  <li>Send your data to external servers</li>
                  <li>Track you across different websites</li>
                  <li>Share your data with third parties</li>
                  <li>Store your data in the cloud</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Your control:</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-800">
                  <li>Clear all data anytime using the button below</li>
                  <li>Data automatically expires after 7 days</li>
                  <li>Data is tied to this browser/device only</li>
                  <li>You can disable storage in your browser settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onAccept}
              className="flex-1"
            >
              I understand, continue
            </Button>
            
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1"
            >
              Don't save my data
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Want to clear all your data?
              </span>
              <Button
                onClick={handleClearAllData}
                variant="outline"
                size="sm"
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear All Data'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PrivacyNotice
