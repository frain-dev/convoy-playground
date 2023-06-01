import { useEffect, useState } from "react";
import General from "../services/general";

const Notification = () => {
    const statusTypes = {
        warning: "bg-warning-50 text-warning-400",
        error: "bg-danger-50 text-danger-400",
        info: "bg-primary-25 text-primary-400",
        success: "bg-success-50 text-success-400",
    };

    const [notification, setNotification] = useState({
        message: "",
        style: "",
        show: false,
    });
    const fetchNotification = () => {
        General.notification.subscribe((notification) => {
            setNotification(notification);
        });
    };

    const dismissNotification = () => {
        General.dismissNotification();
    };

    useEffect(() => {
        fetchNotification();
    }, [fetchNotification]);
    return (
        <div>
            {notification?.show && (
                <div
                    className={`flex items-center justify-between text-14 font-medium capitalize p-8px rounded-8px fixed bottom-50px left-1/2 -translate-x-1/2 -translate-y-0 w-full max-w-[500px] z-[100] ${
                        statusTypes[notification?.style]
                    }`}
                >
                    <div className="flex items-center">
                        <img
                            src={`/${notification?.style}-icon.svg`}
                            className="mr-10px"
                            alt="toast icon"
                        />
                        {notification?.message}
                    </div>
                    <button
                        className="bg-transparent py-6px px-16px mr-6px"
                        onClick={() => dismissNotification()}
                    >
                        <img src="/close-icon.svg" alt="close icon" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notification;
