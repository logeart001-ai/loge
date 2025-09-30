import { createClient } from '@/lib/supabase'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface NotificationData {
  creatorName: string
  submissionTitle: string
  submissionId: string
  reviewDate: string
  feedback?: string
  suggestions?: string
  rejectionReason?: string
  reviewerName?: string
}

export class EmailService {
  private supabase = createClient()

  /**
   * Send submission status notification to creator
   */
  async sendSubmissionStatusNotification(
    creatorEmail: string,
    status: 'approved' | 'rejected' | 'needs_revision',
    data: NotificationData
  ): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(status, data)
      
      // In a real implementation, you would use a service like:
      // - Supabase Edge Functions with Resend
      // - SendGrid
      // - Mailgun
      // - AWS SES
      
      // For now, we'll log the email and store it in a notifications table
      console.log('Email would be sent:', {
        to: creatorEmail,
        subject: template.subject,
        html: template.html
      })

      // Store notification in database
      await this.storeNotification(creatorEmail, template, data)
      
      return true
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  /**
   * Send welcome email to new creators
   */
  async sendWelcomeEmail(creatorEmail: string, creatorName: string): Promise<boolean> {
    try {
      const template = this.getWelcomeEmailTemplate(creatorName)
      
      console.log('Welcome email would be sent:', {
        to: creatorEmail,
        subject: template.subject,
        html: template.html
      })

      await this.storeNotification(creatorEmail, template, { creatorName } as NotificationData)
      
      return true
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return false
    }
  }

  /**
   * Send submission confirmation email
   */
  async sendSubmissionConfirmation(
    creatorEmail: string,
    data: NotificationData
  ): Promise<boolean> {
    try {
      const template = this.getSubmissionConfirmationTemplate(data)
      
      console.log('Submission confirmation would be sent:', {
        to: creatorEmail,
        subject: template.subject,
        html: template.html
      })

      await this.storeNotification(creatorEmail, template, data)
      
      return true
    } catch (error) {
      console.error('Error sending submission confirmation:', error)
      return false
    }
  }

  /**
   * Get email template based on status
   */
  private getEmailTemplate(status: string, data: NotificationData): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logeart.vercel.app'
    
    switch (status) {
      case 'approved':
        return {
          subject: `🎉 Your submission "${data.submissionTitle}" has been approved!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations! 🎉</h1>
              </div>
              
              <div style="padding: 40px 20px; background: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${data.creatorName},</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Great news! Your submission <strong>"${data.submissionTitle}"</strong> has been approved and is now live on the Loge Arts marketplace.
                </p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #15803d; margin: 0 0 10px 0;">Review Feedback:</h3>
                  <p style="color: #166534; margin: 0;">${data.feedback || 'Excellent work! Your submission meets our quality standards.'}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Your Dashboard
                  </a>
                </div>
                
                <p style="color: #4b5563; font-size: 14px;">
                  Your work is now discoverable by art collectors and enthusiasts worldwide. Keep creating amazing pieces!
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>© 2025 Loge Arts. Celebrating African creativity across all mediums.</p>
              </div>
            </div>
          `,
          text: `Hi ${data.creatorName}, Your submission "${data.submissionTitle}" has been approved! ${data.feedback || ''} View your dashboard: ${baseUrl}/dashboard`
        }

      case 'rejected':
        return {
          subject: `Submission Update: "${data.submissionTitle}" requires attention`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #dc2626; padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Submission Update</h1>
              </div>
              
              <div style="padding: 40px 20px; background: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${data.creatorName},</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Thank you for your submission <strong>"${data.submissionTitle}"</strong>. After careful review, we're unable to approve it at this time.
                </p>
                
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #dc2626; margin: 0 0 10px 0;">Reason:</h3>
                  <p style="color: #991b1b; margin: 0;">${data.rejectionReason || 'The submission does not meet our current guidelines.'}</p>
                </div>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Don't be discouraged! We encourage you to review our guidelines and submit new work. Our team is here to support your creative journey.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard/submissions/new" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Submit New Work
                  </a>
                </div>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>© 2025 Loge Arts. Celebrating African creativity across all mediums.</p>
              </div>
            </div>
          `,
          text: `Hi ${data.creatorName}, Your submission "${data.submissionTitle}" was not approved. Reason: ${data.rejectionReason || 'Does not meet guidelines'} Submit new work: ${baseUrl}/dashboard/submissions/new`
        }

      case 'needs_revision':
        return {
          subject: `Revision Requested: "${data.submissionTitle}" - Almost there!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f59e0b; padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Revision Requested</h1>
              </div>
              
              <div style="padding: 40px 20px; background: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${data.creatorName},</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Your submission <strong>"${data.submissionTitle}"</strong> is almost ready! We just need a few small adjustments before we can approve it.
                </p>
                
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #d97706; margin: 0 0 10px 0;">Feedback:</h3>
                  <p style="color: #92400e; margin: 0 0 15px 0;">${data.feedback || ''}</p>
                  
                  <h3 style="color: #d97706; margin: 15px 0 10px 0;">Suggested Changes:</h3>
                  <p style="color: #92400e; margin: 0;">${data.suggestions || 'Please review and make necessary adjustments.'}</p>
                </div>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Once you've made these adjustments, please resubmit your work. We're excited to see the final version!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View & Edit Submission
                  </a>
                </div>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>© 2025 Loge Arts. Celebrating African creativity across all mediums.</p>
              </div>
            </div>
          `,
          text: `Hi ${data.creatorName}, Your submission "${data.submissionTitle}" needs revision. Feedback: ${data.feedback} Suggestions: ${data.suggestions} Edit: ${baseUrl}/dashboard`
        }

      default:
        return {
          subject: `Update on your submission: "${data.submissionTitle}"`,
          html: `<p>Hi ${data.creatorName}, there's an update on your submission "${data.submissionTitle}".</p>`,
          text: `Hi ${data.creatorName}, there's an update on your submission "${data.submissionTitle}".`
        }
    }
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(creatorName: string): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logeart.vercel.app'
    
    return {
      subject: `Welcome to Loge Arts, ${creatorName}! 🎨`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Loge Arts! 🎨</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${creatorName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Welcome to Loge Arts, where African creativity meets global appreciation! We're thrilled to have you join our community of talented creators.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0;">Next Steps:</h3>
              <ul style="color: #1e3a8a; margin: 0; padding-left: 20px;">
                <li>Complete your creator profile</li>
                <li>Add your portfolio links</li>
                <li>Submit your first project for review</li>
                <li>Start building your audience</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard/onboarding" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Complete Profile
              </a>
              <a href="${baseUrl}/dashboard/submissions/new" style="background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Submit Work
              </a>
            </div>
            
            <p style="color: #4b5563; font-size: 14px;">
              If you have any questions, our team is here to help. We can't wait to see your amazing creations!
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>© 2025 Loge Arts. Celebrating African creativity across all mediums.</p>
          </div>
        </div>
      `,
      text: `Welcome to Loge Arts, ${creatorName}! Complete your profile: ${baseUrl}/dashboard/onboarding`
    }
  }

  /**
   * Get submission confirmation template
   */
  private getSubmissionConfirmationTemplate(data: NotificationData): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logeart.vercel.app'
    
    return {
      subject: `Submission Received: "${data.submissionTitle}" ✅`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Submission Received ✅</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${data.creatorName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for submitting <strong>"${data.submissionTitle}"</strong> to Loge Arts! We've received your work and it's now in our review queue.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">What happens next?</h3>
              <p style="color: #065f46; margin: 0;">Our review team will carefully evaluate your submission within 3-5 business days. You'll receive an email notification with the results and any feedback.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Track Your Submission
              </a>
            </div>
            
            <p style="color: #4b5563; font-size: 14px;">
              While you wait, feel free to submit more work or explore other creators on our platform.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>© 2025 Loge Arts. Celebrating African creativity across all mediums.</p>
          </div>
        </div>
      `,
      text: `Hi ${data.creatorName}, we've received your submission "${data.submissionTitle}". Review takes 3-5 days. Track progress: ${baseUrl}/dashboard`
    }
  }

  /**
   * Store notification in database for tracking
   */
  private async storeNotification(
    email: string,
    template: EmailTemplate,
    data: NotificationData
  ): Promise<void> {
    try {
      // Create notifications table if it doesn't exist
      await this.supabase.rpc('create_notifications_table_if_not_exists')
      
      await this.supabase
        .from('notifications')
        .insert({
          recipient_email: email,
          subject: template.subject,
          content: template.html,
          type: 'email',
          status: 'sent',
          metadata: data
        })
    } catch (error) {
      console.error('Error storing notification:', error)
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()