import { Button, Form, Input } from 'antd';
import { HddOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
interface IFormValues {
    login: string;
    server: string;
    password: string;
}
interface IOnFinishProps {
    onFinish: (values: IFormValues) => void;
    loading: boolean;
}

const Auth = ({ onFinish, loading }: IOnFinishProps) => {
    return (
        <div style={{ padding: '10px' }}>
            <Form
                name='register'
                initialValues={{ remember: true }}
                onFinish={onFinish}
            >
                <Form.Item
                    name='login'
                    rules={[
                        {
                            required: true,
                            message: 'Введите логин!',
                        },
                    ]}
                >
                    <Input
                        prefix={
                            <UserOutlined className='site-form-item-icon' />
                        }
                        placeholder='логин'
                    />
                </Form.Item>
                <Form.Item
                    name='server'
                    rules={[
                        {
                            required: true,
                            message: 'Введите имя сервера!',
                        },
                    ]}
                >
                    <Input
                        prefix={<HddOutlined className='site-form-item-icon' />}
                        placeholder='сервер'
                    />
                </Form.Item>
                <Form.Item
                    name='password'
                    rules={[
                        {
                            required: true,
                            message: 'Введите пароль!',
                        },
                    ]}
                >
                    <Input
                        prefix={
                            <LockOutlined className='site-form-item-icon' />
                        }
                        type='password'
                        placeholder='Пароль'
                    />
                </Form.Item>
                <Form.Item>
                    <Button
                        loading={loading}
                        block
                        type='primary'
                        htmlType='submit'
                    >
                        зарегистрироваться
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Auth;
