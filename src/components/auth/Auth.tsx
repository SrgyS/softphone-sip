import { Button, Form, Input } from 'antd';
import { HddOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
interface IFormValues {
    login: string;
    server: string;
    password: string;
}
interface IOnFinishProps {
    onFinish: (values: IFormValues) => void;
}

const Auth = ({ onFinish }: IOnFinishProps) => {
    return (
        <div style={{ padding: '10px' }}>
            <Form
                name='normal_login'
                className='login-form'
                initialValues={{ remember: true }}
                onFinish={onFinish}
            >
                <Form.Item
                    name='login'
                    rules={[
                        {
                            required: false,
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
                            required: false,
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
                            required: false,
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
                        block
                        type='primary'
                        htmlType='submit'
                        className='login-form-Button'
                    >
                        зарегистрироваться
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Auth;
