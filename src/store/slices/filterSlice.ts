import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {supabaseClient} from '../../../utils/supabase'
import * as timers from "node:timers";

interface Product {
    ID: string;
    Handle: string;
    Title: string;
    "Body (HTML)": string;
    Vendor: string;
    "Product Category": string;
    Tags: string | null;
    Published: string;
    "Size Name": string;
    "Size Value": string;
    "Variant SKU": string | null;
    "Variant Price": number;
    "Image Src": string;
    "Image Position": number;
    "Image Alt Text": string;
    "Product rating": string | null;
}

export interface GroupedProduct {
    Title: string;
    Handle: string;
    Vendor: string;
    "Product Category": string;
    "Variant Price": number | null;
    images: {
        src: string;
        alt: string;
        position: number;
    }[];
}

export interface ProductsFiltersInterface {
    category?: string;
    vendor?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface FilterOptionsType {
    categories: string[];
    vendors: string[];
    sizes: string[];
    priceRange: {
        min: number;
        max: number;
    };
}

interface ProductsState {
    products: Product[];
    groupedProducts: GroupedProduct[];
    filteredProducts: GroupedProduct[];
    activeImageIndex: Record<string, number>
    filters: ProductsFiltersInterface;
    filterOptions: FilterOptionsType;
    loading: boolean;
    error: string | null;
}

const initialState:  ProductsState = {
    products: [],
    groupedProducts: [],
    filteredProducts: [],
    activeImageIndex: {},
    filters: {
        category: '',
        vendor: '',
        minPrice: undefined,
        maxPrice: undefined,
        sizes: [],
        search: '',
        sort: 'ID_desc',
        page: 1,
        limit: 60
    },
    filterOptions: {
        categories:[],
        vendors: [],
        sizes: [],
        priceRange: {min: 0, max: 0},
    },
    loading: false,
    error: null
}

export const fetchProducts = createAsyncThunk (
    "products/fetchProducts",
    async (_, { rejectWithValue }) => {
        try {
            const {data, error: supabaseError} = await supabaseClient.from('table_product').select('*')

        if (supabaseError) {
            return rejectWithValue(new Error(`Error to get data ${supabaseError.message}`))
        }
        return data
    }
        catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred')
        }
      }
)

export const processProducts = createAsyncThunk (
    "products/processProducts",
    async (_, {getState, dispatch}) => {
        const state = getState() as {filters: ProductsState};
        const products = state.filters.products;

        const productsMap = new Map <string, GroupedProduct> ();
        const categories = new Set <string> ();
        const vendors = new Set <string> ();
        const sizes = new Set <string> ();
        let minPrice = Infinity;
        let maxPrice = 0;

        products.forEach((product:Product)=> {
            const handle = product.Handle;

            if (product['Product Category']) categories.add(product['Product Category']);
            if (product.Vendor) vendors.add(product.Vendor)
            if (product['Size Value']) sizes.add(product['Size Value'])
            if (product["Variant Price"]) {
                minPrice = Math.min(minPrice, product["Variant Price"])
                maxPrice = Math.max(maxPrice, product["Variant Price"])
            }
            if (!productsMap.has(handle)) {
                const title = product.Title || handle

                productsMap.set(handle, {
                    Title: title,
                    Handle: handle,
                    Vendor: product.Vendor || '',
                    'Product Category': product['Product Category'] || '',
                    'Variant Price': product['Variant Price'] || null,
                    images: []
                });
        } else {
            const currentProduct = productsMap.get(handle)!;

            if (product.Title && (currentProduct.Title === handle || !currentProduct.Title)) {
            currentProduct.Title = product.Title
            }
            if (product['Variant Price'] && !currentProduct['Variant Price']) {
                currentProduct['Variant Price'] = product['Variant Price']
            }
            if (product.Vendor && !currentProduct.Vendor) {
                currentProduct.Vendor = product.Vendor
            }
            if (product['Product Category'] && !currentProduct['Product Category']) {
                currentProduct['Product Category'] = product['Product Category']
            }
            }
            if (product['Image Src']) {
                const groupedProduct = productsMap.get(handle)!
                const imagesExists = groupedProduct.images.some(img =>img.src===process['Image Src'])
                if (!imagesExists) {
                    groupedProduct.images.push({
                        src:product['Image Src'],
                        alt: product['Image Alt Text'] || product.Title || handle,
                        position: product['Image Position']
                    });
                }
            }
        });

        const initialActiveImageIndexes: Record<string, number> ={};
        Array.from(productsMap.keys()).forEach(handle => {
            initialActiveImageIndexes[handle]=0
        });

        const filterOptions = {
            categories: Array.from(categories),
            vendors: Array.from(vendors),
            sizes: Array.from(sizes),
            priceRange: {
                min:minPrice ===Infinity? 0 : minPrice,
                max: maxPrice === 0? 1000 : maxPrice
            }
        };
        const groupedProducts = Array.from(productsMap.values())
    dispatch(applyFilters());

        return {
            groupedProducts,
            activeImageIndex: initialActiveImageIndexes,
            filterOptions
        };
    }
);


const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<ProductsFiltersInterface>) => {
            return {...state,  ...action.payload}
        },
        resetFilters: () => initialState,
    },
    extraReducers: (builder)=> {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchProducts.fulfilled, (state,action) => {
                state.loading = false;
                state.products = action.payload;
                state.error = null

            })
            .addCase( fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.products= []
            })

    }

})

const {setFilters, resetFilters} = filterSlice.actions;
export default filterSlice.reducer