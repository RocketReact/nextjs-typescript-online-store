import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {supabaseClient} from '../../../utils/supabase/client'

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
        let maxPrice = -Infinity;

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
                const imagesExists = groupedProduct.images.some(img =>img.src===product['Image Src'])
                if (!imagesExists) {
                    groupedProduct.images.push({
                        src:product['Image Src'],
                        alt: product['Image Alt Text'] || product.Title || handle,
                        position: product['Image Position']
                    });
                }
            }
        });

        // Сортируем изображения по позиции для каждого продукта
        productsMap.forEach(product => {
            product.images.sort((a, b) => a.position - b.position);
        });

        // Создаем начальные индексы активных изображений с учетом позиции
        const initialActiveImageIndexes: Record<string, number> = {};
        productsMap.forEach((product, handle) => {
            // Если есть изображения, найдем индекс первого изображения с position=1 (или минимальной позицией)
            if (product.images.length > 0) {
                // Ищем изображение с position=1
                const indexOfPositionOne = product.images.findIndex(img => img.position === 1);
                // Если нашли, используем его, иначе берем первое изображение (индекс 0)
                initialActiveImageIndexes[handle] = indexOfPositionOne !== -1 ? indexOfPositionOne : 0;
            } else {
                initialActiveImageIndexes[handle] = 0;
            }
        });

        const filterOptions = {
            categories: Array.from(categories),
            vendors: Array.from(vendors),
            sizes: Array.from(sizes),
            priceRange: {
                min:minPrice ===Infinity? 0 : minPrice,
                max: maxPrice === -Infinity? 1000 : maxPrice
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

export const applyFilters = createAsyncThunk (
    "products/applyFilters",
    async (_,{getState}) => {
        const state = getState() as { filters: ProductsState };
        const {groupedProducts, filters} = state.filters;

        if (groupedProducts.length === 0) return [];
        let filtered = [...groupedProducts];

        if (filters.category) {
            filtered = filtered.filter(product =>
                product['Product Category'] === filters.category
            );
        }

        if (filters.vendor) {
            filtered = filtered.filter(product =>
                product.Vendor === filters.vendor
            );
        }

        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(product =>
                product['Variant Price'] !== null && product['Variant Price'] >= filters.minPrice!
            );
        }
        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(product =>
                product['Variant Price'] !== null && product['Variant Price'] <= filters.maxPrice!
            );
        }
        //Search by name
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.Title.toLowerCase().includes(searchLower) ||
                product.Vendor.toLowerCase().includes(searchLower)
            );
        }
        //Sorting
        if (filters.sort) {
            switch ((filters.sort)) {
                case 'price_asc':
                    filtered.sort((a, b) => {
                        if (a['Variant Price'] === null) return 1;
                        if (b['Variant Price'] === null) return -1;
                        return a['Variant Price'] - b['Variant Price']
                    });
                    break;
                case 'price_desc':
                    filtered.sort((a, b) => {
                        if (a['Variant Price'] === null) return 1;
                        if (b['Variant Price'] === null) return -1;
                        return b['Variant Price'] - a['Variant Price']
                    });
                    break;

                case 'title_asc':
                    filtered.sort((a, b) =>
                        a.Title.localeCompare(b.Title));
                    break;
                case 'title_desc':
                    filtered.sort((a, b) =>
                        b.Title.localeCompare(a.Title));
                    break;
                default:
                    break;
            }
        }

        //Paginations
        const startIndex = (filters.page && filters.limit)
            ? (filters.page - 1) * filters.limit
            : 0;
        const endIndex = (filters.page && filters.limit)
            ? startIndex + filters.limit
            : filtered.length;
        return filtered.slice(startIndex, endIndex);
    }
);


const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        //Update all filters
        setFilters: (state, action: PayloadAction<ProductsFiltersInterface>) => {
            state.filters={...state.filters,  ...action.payload}
        },
        //Reset filters
        resetFilters: (state) => {
            state.filters = initialState.filters
        },
        changeActiveImage:(state, action:PayloadAction<{handle:string,index:number}>) => {
            const {handle, index} = action.payload;
            state.activeImageIndex[handle] = index;
        }
    },
    extraReducers: (builder)=> {
        builder
            //fetchProducts
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
            //processProducts
            .addCase(processProducts.fulfilled, (state, action) => {
                state.groupedProducts=action.payload.groupedProducts;
                state.activeImageIndex = action.payload.activeImageIndex;
                state.filterOptions = action.payload.filterOptions;
            })
            //applyFilters
            .addCase (applyFilters.fulfilled, (state, action) => {
                state.filteredProducts=action.payload;
            });

    }

});

export const {setFilters, resetFilters, changeActiveImage} = filterSlice.actions;
export default filterSlice.reducer