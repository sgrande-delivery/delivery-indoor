import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';
import CheckoutLayout from './CheckoutLayout';
import DefaultLayout from './DefaultLayout';
import AuthLayout from './AuthLayout';
import IndexLayout from './IndexLayout';

const authPaths = [
  '/register',
  '/guest-register',
  '/password-request',
  '/password-reset/[token]',
  '/forgot/email',
  '/forgot/sms',
];

const checkoutPaths = ['/checkout'];

const indexPath = ['/'];

const LayoutHandler: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  return (
    <>
      {authPaths.includes(router.route) ? (
        <AuthLayout>{children}</AuthLayout>
      ) : checkoutPaths.includes(router.route) ? (
        <CheckoutLayout>{children}</CheckoutLayout>
      ) : indexPath.includes(router.route) ? (
        <IndexLayout>{children}</IndexLayout>
      ) : (
        <DefaultLayout>{children}</DefaultLayout>
      )}
    </>
  );
};

export default LayoutHandler;
