import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const getItemId = (item) => item?.id || item?._id;

const useOrderCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      table: null,

      addItem: (product) => {
        const normalizedProduct = {
          id: product?.id || product?._id,
          _id: product?._id || product?.id,
          name: product?.name || product?.title || 'Producto',
          price: Number(product?.price || 0),
          quantity: Number(product?.quantity || 1),
          isMenu: Boolean(product?.isMenu),
        };

        const existing = get().items.find((item) => getItemId(item) === getItemId(normalizedProduct));
        if (existing) {
          set((state) => ({
            items: state.items.map((item) =>
              getItemId(item) === getItemId(normalizedProduct)
                ? { ...item, quantity: item.quantity + normalizedProduct.quantity }
                : item
            ),
          }));
          return;
        }

        set((state) => ({ items: [...state.items, normalizedProduct] }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            getItemId(item) === productId ? { ...item, quantity } : item
          ),
        }));
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => getItemId(item) !== productId),
        }));
      },

      clearItems: () => set({ items: [], restaurantId: null, restaurantName: null, table: null }),

      setItems: (items) => set({ items }),

      setRestaurant: (restaurant) =>
        set({
          restaurantId: restaurant?.id || restaurant?._id || null,
          restaurantName: restaurant?.name || null,
        }),

      setTable: (table) => set({ table }),
    }),
    {
      name: 'order-cart-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOrderCartStore;
