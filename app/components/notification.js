const Notification = ({ style, message, show }) => {
    const statusTypes = {
        warning: "bg-warning-500 text-warning-100",
        error: "bg-danger-500 text-danger-100",
        info: "bg-primary-500 text-primary-100",
        success: "bg-success-500 text-success-100",
    };
    return (
        <div>
            {show && (
                <div
                    className={`flex items-center justify-between text-14 font-medium capitalize p-8px rounded-8px fixed bottom-50px left-1/2 -translate-x-1/2 -translate-y-0 w-full max-w-[500px] z-[100] ${statusTypes[style]}`}
                >
                    <div className="flex items-center">
                        <img
                            src={`/${style}-icon.svg`}
                            class="mr-10px"
                            alt="toast icon"
                        />
                        {message}
                    </div>
                    <button className="bg-transparent py-6px px-16px mr-6px">
                        <img src="/close-icon.svg" alt="close icon" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notification;
