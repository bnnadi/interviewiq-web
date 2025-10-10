import React, { useState } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA'
    },
    professionalInfo: {
      currentRole: 'Software Engineer',
      experience: '5 years',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
      interests: ['Frontend Development', 'Machine Learning', 'Product Management']
    },
    preferences: {
      interviewTypes: ['Technical', 'Behavioral', 'System Design'],
      difficulty: 'Intermediate',
      timezone: 'PST'
    }
  })

  const [isEditing, setIsEditing] = useState(false)

  const handleInputChange = (section: string, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Profile saved:', profile)
    setIsEditing(false)
    // Show success message
  }


  const stats = {
    totalSessions: 12,
    averageScore: 7.2,
    improvementRate: 15,
    currentStreak: 5,
    joinDate: '2024-01-01'
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Profile
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600">
              {profile.personalInfo.firstName[0]}{profile.personalInfo.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.personalInfo.firstName} {profile.personalInfo.lastName}
            </h2>
            <p className="text-gray-600">{profile.personalInfo.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="success">Active</Badge>
              <span className="text-sm text-gray-500">
                Member since {new Date(stats.joinDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="mb-2"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} className="ml-2">
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={profile.personalInfo.firstName}
              onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={profile.personalInfo.lastName}
              onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.personalInfo.email}
              onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profile.personalInfo.phone}
              onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={profile.personalInfo.location}
              onChange={(e) => handleInputChange('personalInfo', 'location', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </Card>

      {/* Professional Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Role
              </label>
              <input
                type="text"
                value={profile.professionalInfo.currentRole}
                onChange={(e) => handleInputChange('professionalInfo', 'currentRole', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience
              </label>
              <input
                type="text"
                value={profile.professionalInfo.experience}
                onChange={(e) => handleInputChange('professionalInfo', 'experience', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.professionalInfo.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.professionalInfo.interests.map((interest, index) => (
                <Badge key={index} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.averageScore}</div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">+{stats.improvementRate}%</div>
            <div className="text-sm text-gray-600">Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Profile
