import api from "./api";

export const saveExpoToken = async (expoToken) => {
    const response = await api.post("/notifications/token", {
        expoToken,
    });

    return response.data;
};

export const getNotificationsHistory = async () => {
    const response = await api.get("/notifications/history");
    return response.data;
};