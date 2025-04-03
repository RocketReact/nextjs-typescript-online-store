import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import type {AppDispatch, RootState} from "../store/store";
import {
    fetchProducts,
    processProducts,
    applyFilters,
    setFilters,
    resetFilters,
    changeActiveImage,
    ProductsFiltersInterface
} from '@/store/slices/filterSlice'

export default function  useProductsRedux () {
    const dispatch = useDispatch<AppDispatch>();
    const {
        loading,
        error,
        groupedProducts,
        activeImageIndex,
        filters,
        filterOptions,
    } = useSelector((state:RootState) => state.filters)

    //fetchProducts
    useEffect(() => {
        if (groupedProducts.length === 0) {
            dispatch(fetchProducts())
                .unwrap()
                .then(() => {
                    dispatch(processProducts())
                })
                .catch((err:unknown) => {
                    console.error('Error fetch products', err)
                })
        }
    }, [groupedProducts.length, dispatch])

    //Applying filters if change filters param
   useEffect(() => {
       if(groupedProducts.length > 0) {
           dispatch(applyFilters())
       }
   }, [dispatch, filters, groupedProducts.length])

  //Change filters
  const handleFilterChange = (newFilters: ProductsFiltersInterface) => {
        dispatch(setFilters(newFilters))
  }
  //Reset filters
    const handleResetFilters = () => {
        dispatch(resetFilters())
    }
  //Change active image
    const handleChangeActiveImage = (handle:string, index:number) => {
        dispatch(changeActiveImage({handle,index}))
    }

    return {
        loading,
        error,
        groupedProducts,
        activeImageIndex,
        filters,
        filterOptions,
        handleFilterChange,
        resetFilters: handleResetFilters,
        changeActiveImage:handleChangeActiveImage
    }
}