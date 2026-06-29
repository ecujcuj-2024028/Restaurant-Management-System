import { Platform } from "react-native";

let Notifications;
let isDevice;

if (Platform.OS !== "web") {
    Notifications = require("expo-notifications").default;
    isDevice = require("expo-device").isDevice;
}

if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } =
                await Notifications.requestPermissionsAsync();

            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            return null;
        }

        token = (
            await Notifications.getExpoPushTokenAsync()
        ).data;
    } else {
        // Simulación para desarrollo/web
        token = "MockExpoToken-" + Math.random().toString(36).substring(7);
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
            "default",
            {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                sound: true,
            }
        );
    }

    return token;
};