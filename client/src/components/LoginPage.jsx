import { Button, Card, Form, Input, Alert, Space, Tag, Typography, Checkbox, Divider } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { apiBaseUrl } from '../services/auth.js'

const { Title, Paragraph, Text } = Typography

function LoginPage() {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, getHomeRouteForRole } = useAuth()

  const handleFinish = async (values) => {
    setIsSubmitting(true)
    setServerError('')

    try {
      const session = await signIn({
        email: values.email,
        password: values.password,
      })

      const nextRoute = location.state?.from?.pathname || getHomeRouteForRole(session.user.role)
      form.resetFields(['password'])
      navigate(nextRoute, { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.32),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.28),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_transparent)]" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-12 lg:grid lg:grid-cols-[1.1fr_520px] lg:items-center lg:px-10">
        <div className="max-w-2xl">
          <Tag className="!mb-5 !rounded-full !border-emerald-200/20 !bg-emerald-300/10 !px-4 !py-1 !text-emerald-100">
            Enterprise EMR Platform
          </Tag>
          <Title className="!mb-5 !text-4xl !font-semibold !tracking-tight !text-white md:!text-6xl">
            Secure access for appointment operations and patient workflows.
          </Title>
          <Paragraph className="!mb-8 !max-w-xl !text-base !leading-7 !text-slate-300 md:!text-lg">
            Sign in with your staff credentials. Route access is protected by role and the current frontend only unlocks the super admin workspace.
          </Paragraph>
          <Space size="middle" wrap>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <Text className="!block !text-xs !uppercase !tracking-[0.24em] !text-slate-400">Session model</Text>
              <Text className="!text-sm !text-slate-100">JWT access token + refresh cookie</Text>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <Text className="!block !text-xs !uppercase !tracking-[0.24em] !text-slate-400">API base</Text>
              <Text className="!text-sm !text-slate-100">{apiBaseUrl}</Text>
            </div>
          </Space>
        </div>

        <Card className="rounded-[28px] border border-white/10 bg-white/95 shadow-2xl shadow-slate-950/30">
          <div className="mb-8">
            <Text className="!text-xs !font-semibold !uppercase !tracking-[0.3em] !text-teal-700">Welcome back</Text>
            <Title level={2} className="!mb-2 !mt-3 !text-slate-900">Sign in</Title>
            <Paragraph className="!mb-0 !text-slate-500">
              Use a super admin account to access the protected admin console.
            </Paragraph>
          </div>

          {serverError ? <Alert className="mb-6" message={serverError} type="error" showIcon /> : null}

          <Form form={form} layout="vertical" size="large" initialValues={{ remember: true }} onFinish={handleFinish}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input placeholder="admin@hospital.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 8, message: 'Password must contain at least 8 characters' },
              ]}
            >
              <Input.Password placeholder="Enter your password" autoComplete="current-password" />
            </Form.Item>

            <div className="mb-6 flex items-center justify-between gap-3">
              <Form.Item className="!mb-0" name="remember" valuePropName="checked">
                <Checkbox>Remember this device</Checkbox>
              </Form.Item>
              <Button type="link" className="!px-0">Forgot password?</Button>
            </div>

            <Form.Item className="!mb-4">
              <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                Sign in
              </Button>
            </Form.Item>
          </Form>

          <Divider className="!my-6 !border-slate-200">Access notes</Divider>

          <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">All admin routes are protected in the client router.</div>
            <div className="rounded-2xl bg-slate-50 p-4">Unauthorized roles are redirected to an access denied screen.</div>
          </div>
        </Card>
      </section>
    </main>
  )
}

export default LoginPage

