import { ReactNode } from 'react';

interface ClientProductPageProps {
  product: any | null;
  slug: string;
}

declare const ClientProductPage: (props: ClientProductPageProps) => ReactNode;

export default ClientProductPage;
