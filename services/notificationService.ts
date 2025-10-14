import { Bill, Goal, Asset, Debt, Transaction, Notification } from '../types';
import { differenceInDays, format, isWithinInterval, addDays } from 'date-fns';

const formatCurrency = (amount: number, currency: string = 'GBP') => {
    const options = { style: 'currency', currency, minimumFractionDigits: 2 };
    const locale = currency === 'GBP' ? 'en-GB' : currency === 'USD' ? 'en-US' : 'de-DE';
    return new Intl.NumberFormat(locale, options).format(amount);
};

// --- Notification Generation Logic ---

const generateBillReminders = (bills: Bill[]): Notification[] => {
    const notifications: Notification[] = [];
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    bills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        if (isWithinInterval(dueDate, { start: today, end: threeDaysFromNow })) {
            const daysUntilDue = differenceInDays(dueDate, today);
            const dueString = daysUntilDue === 0 ? 'is due today' : daysUntilDue === 1 ? 'is due tomorrow' : `is due in ${daysUntilDue} days`;
            
            notifications.push({
                id: `bill-${bill.id}`,
                message: `${bill.name} payment of ${formatCurrency(bill.amount)} ${dueString}.`,
                type: 'Bill',
                date: new Date().toISOString(),
                read: false,
            });
        }
    });
    return notifications;
};

const generateGoalMilestones = (goals: Goal[], assets: Asset[]): Notification[] => {
    const notifications: Notification[] = [];
    const milestones = [50, 75, 90, 100];

    goals.forEach(goal => {
        const totalSaved = goal.linkedAccountIds.reduce((total, id) => {
            const account = assets.find(a => a.id === id);
            if (!account) return total;
            const percentage = goal.allocations[id] || 0;
            return total + (account.balance * (percentage / 100));
        }, 0);

        const progress = goal.targetAmount > 0 ? (totalSaved / goal.targetAmount) * 100 : 0;
        
        const lastHitMilestone = milestones.slice().reverse().find(m => progress >= m);

        if (lastHitMilestone) {
             // To prevent spamming, a real app would store which milestones have been notified.
             // For this simulation, we'll just check if it's around a milestone.
            if (progress > lastHitMilestone && progress < lastHitMilestone + 5) {
                notifications.push({
                    id: `goal-${goal.id}-${lastHitMilestone}`,
                    message: `Congratulations! You've reached ${Math.floor(progress)}% of your "${goal.name}" goal.`,
                    type: 'Goal',
                    date: new Date().toISOString(),
                    read: false,
                });
            }
        }
    });
    return notifications;
}

const generateWelcomeBack = (lastLogin: string, transactions: Transaction[]): Notification[] => {
    const daysSinceLastLogin = differenceInDays(new Date(), new Date(lastLogin));
    if (daysSinceLastLogin > 3) {
        const transactionCount = transactions.filter(t => new Date(t.date) > new Date(lastLogin)).length;
        if (transactionCount > 0) {
            return [{
                id: 'welcome-back',
                message: `Welcome back! ${transactionCount} transaction${transactionCount > 1 ? 's' : ''} occurred while you were away.`,
                type: 'Info',
                date: new Date().toISOString(),
                read: false,
            }];
        }
    }
    return [];
}

const generateDailyDigest = (assets: Asset[], debts: Debt[]): Notification[] => {
    const now = new Date();
    if (now.getHours() >= 17) { // After 5 PM
        const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
        const totalDebts = debts.reduce((sum, acc) => sum + acc.balance, 0);
        const netWorth = totalAssets - totalDebts;

        // Mock previous day's net worth for percentage change
        const previousNetWorth = netWorth * (1 - (Math.random() - 0.5) * 0.05); // Random -2.5% to +2.5% change
        const change = netWorth - previousNetWorth;
        const percentChange = (change / previousNetWorth) * 100;

        return [{
            id: `digest-${format(now, 'yyyy-MM-dd')}`,
            message: `Daily Digest: Your net worth changed by ${percentChange.toFixed(2)}% to ${formatCurrency(netWorth)}.`,
            type: 'Summary',
            date: new Date().toISOString(),
            read: false,
        }];
    }
    return [];
}


export const generateNotifications = (
    bills: Bill[],
    goals: Goal[],
    assets: Asset[],
    debts: Debt[],
    transactions: Transaction[],
    lastLogin: string
): Notification[] => {
    const billNotifications = generateBillReminders(bills);
    const goalNotifications = generateGoalMilestones(goals, assets);
    const welcomeNotifications = generateWelcomeBack(lastLogin, transactions);
    const digestNotifications = generateDailyDigest(assets, debts);
    
    // Combine and remove duplicates
    const allNotifications = [
        ...billNotifications,
        ...goalNotifications,
        ...welcomeNotifications,
        ...digestNotifications
    ];
    
    const uniqueNotifications = allNotifications.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    return uniqueNotifications;
};