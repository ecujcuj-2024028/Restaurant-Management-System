import api from "./api";

export const saveExpoToken = async (expoToken) => {
    const response = await api.post("/users/profile/notifications/token", {
        expoToken,
    });

    return response.data;
};

export const getNotificationsHistory = async () => {
    const response = await api.get("/notifications");
    return response.data;
};

export const markAsRead = async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await api.patch("/notifications/mark-all-read");
    return response.data;
};

export const deleteNotification = async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
};