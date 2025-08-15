import { Request, Response } from 'express'
import User from '../model/User'

export const createOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const { email, name, picture, provider, providerId } = req.body

    // Check if user already exists
    let user = await User.findOne({ email })

    if (user) {
      // Update existing user
      user.name = name
      user.picture = picture
      user.provider = provider
      user.providerId = providerId
      await user.save()
    } else {
      // Create new user
      user = new User({
        email,
        name,
        picture,
        provider,
        providerId,
      })
      await user.save()
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating/updating user',
      error: error.message,
    })
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId).select('-providerId')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message,
    })
  }
}

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id
    const updates = req.body

    // Remove sensitive fields from updates
    delete updates.providerId
    delete updates.provider

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-providerId')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message,
    })
  }
}
