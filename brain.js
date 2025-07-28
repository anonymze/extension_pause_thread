// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Keep track of debugging state
let isDebugging = false;
let currentTabId = null;

// Helper to safely detach debugger
async function safeDetachDebugger(tabId) {
    if (!tabId) return;
    
    try {
        // Check if tab still exists
        const tab = await browserAPI.tabs.get(tabId);
        if (tab) {
            await browserAPI.debugger.detach({ tabId });
        }
    } catch (error) {
        // Tab doesn't exist or debugger already detached
        console.log('Tab no longer exists or debugger already detached');
    }
    isDebugging = false;
    currentTabId = null;
}

// Listen for keyboard command
browserAPI.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-pause") {
        try {
            // Get the active tab
            const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                console.log('No active tab found');
                return;
            }

            // If we were debugging a different tab, clean it up first
            if (currentTabId && currentTabId !== tab.id) {
                await safeDetachDebugger(currentTabId);
            }

            if (!isDebugging) {
                try {
                    // Attach debugger and enable it
                    await browserAPI.debugger.attach({ tabId: tab.id }, "1.3");
                    await browserAPI.debugger.sendCommand({ tabId: tab.id }, "Debugger.enable");
                    
                    // Pause execution
                    await browserAPI.debugger.sendCommand({ tabId: tab.id }, "Debugger.pause");
                    isDebugging = true;
                    currentTabId = tab.id;
                } catch (error) {
                    // console.error("Failed to attach debugger:", error);
                    await safeDetachDebugger(tab.id);
                }
            } else {
                // Resume execution
                try {
                    await browserAPI.debugger.sendCommand({ tabId: tab.id }, "Debugger.resume");
                    await safeDetachDebugger(tab.id);
                } catch (error) {
                    // console.error("Failed to detach debugger:", error);
                    // Force cleanup of state even if detach fails
                    isDebugging = false;
                    currentTabId = null;
                }
            }
        } catch (error) {
            console.error("Error in command handler:", error);
        }
    }
});

// Clean up debugger when tab is closed
browserAPI.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === currentTabId) {
        await safeDetachDebugger(tabId);
    }
});

// Clean up debugger when window is closed
browserAPI.windows.onRemoved.addListener(async () => {
    if (currentTabId) {
        await safeDetachDebugger(currentTabId);
    }
});
