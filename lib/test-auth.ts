'use server'

export async function testSignUp(prevState: unknown, formData: FormData) {
  console.log('🧪 TEST SIGNUP FUNCTION RUNNING')
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const userType = formData.get('userType') as string

  console.log('Test form data:', { email, password: '***', fullName, userType })

  // Always return success for testing
  return {
    success: true,
    message: 'TEST: Account creation would work here!',
    redirectTo: '/auth/signin'
  }
}