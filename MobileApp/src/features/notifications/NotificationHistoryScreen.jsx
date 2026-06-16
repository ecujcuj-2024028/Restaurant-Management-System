import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
} from "react-native";

import { getNotificationsHistory } from "../../api/notifications";

export default function NotificationHistoryScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await getNotificationsHistory();
            setNotifications(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator />;
    }

    return (
        <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={{ padding: 15 }}>
                    <Text>{item.title}</Text>
                    <Text>{item.message}</Text>
                </View>
            )}
        />
    );
}