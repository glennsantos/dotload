// Type definitions for product creation components
declare module './ProductTypeSelection' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductTypeSelectionProps {
    productData: Product;
    setProductData: React.Dispatch<React.SetStateAction<Product>>;
  }
  
  const ProductTypeSelection: FC<ProductTypeSelectionProps>;
  export default ProductTypeSelection;
}

declare module './ProductInformation' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductInformationProps {
    productData: Product;
    setProductData: React.Dispatch<React.SetStateAction<Product>>;
  }
  
  const ProductInformation: FC<ProductInformationProps>;
  export default ProductInformation;
}

declare module './ProductFiles' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductFilesProps {
    productData: Product;
    setProductData: React.Dispatch<React.SetStateAction<Product>>;
  }
  
  const ProductFiles: FC<ProductFilesProps>;
  export default ProductFiles;
}

declare module './ProductPreview' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductPreviewProps {
    productData: Product;
  }
  
  const ProductPreview: FC<ProductPreviewProps>;
  export default ProductPreview;
}

declare module './ProductAdvancedOptions' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductAdvancedOptionsProps {
    productData: Product;
    setProductData: React.Dispatch<React.SetStateAction<Product>>;
  }
  
  const ProductAdvancedOptions: FC<ProductAdvancedOptionsProps>;
  export default ProductAdvancedOptions;
}

declare module './ProductStockPricing' {
  import { FC } from 'react';
  import { Product } from './ProductCreationForm';
  
  interface ProductStockPricingProps {
    productData: Product;
    setProductData: React.Dispatch<React.SetStateAction<Product>>;
  }
  
  const ProductStockPricing: FC<ProductStockPricingProps>;
  export default ProductStockPricing;
}
