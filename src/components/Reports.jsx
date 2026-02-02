import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, isSameDay, subWeeks, addWeeks, subMonths, addMonths, subDays, startOfDay, endOfDay, addDays, isSameWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { Download, BarChart2, Calendar as CalendarIcon, Inbox, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Infinity as InfinityIcon, CalendarRange, CalendarDays } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ExportModal from './ExportModal';

// Override some calendar styles
const calendarStyles = `
  .react-calendar {
    width: 100%;
    background: var(--color-bg-surface);
    border: none;
    border-radius: var(--radius-md);
    font-family: 'Outfit', sans-serif;
    line-height: 1.125em;
    padding: 16px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }
  .react-calendar__navigation {
    display: flex;
    margin-bottom: 1em;
  }
  .react-calendar__navigation button {
    min-width: 44px;
    background: transparent !important;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 8px;
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }
  .react-calendar__navigation button:disabled {
    background-color: transparent !important;
    opacity: 0.3;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: var(--color-bg-body) !important;
  }
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
    text-decoration: none;
  }
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
    border-bottom: 2px solid transparent;
    padding-bottom: 2px;
  }
  .react-calendar__month-view__weekdays__weekday:hover abbr {
    border-bottom-color: var(--color-primary);
  }
  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: bold;
  }
  .react-calendar__tile {
    max-width: 100%;
    padding: 12px 6px;
    background: none;
    text-align: center;
    line-height: 16px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-main);
    border-radius: 12px; /* Rounded corners */
    transition: all 0.2s;
    position: relative;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: var(--color-bg-body);
    color: var(--color-primary);
  }
  .react-calendar__tile--now {
    background: transparent;
    color: var(--color-primary);
    font-weight: bold;
    border: 1px solid var(--color-primary);
  }
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: var(--color-primary-light);
    color: white;
  }
  .react-calendar__tile--hasActive {
    background: var(--color-primary-light);
  }
  .react-calendar__tile--active {
    background: var(--color-primary) !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
  }
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: var(--color-primary-dark);
  }
  .react-calendar__tile:disabled {
    background-color: transparent !important;
    color: var(--color-text-muted) !important;
    opacity: 0.4;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: var(--color-text-muted) !important;
    opacity: 0.5;
  }
  /* Indicator for data */
  .tile-dot {
      height: 4px;
      width: 4px;
      background-color: var(--color-danger);
      border-radius: 50%;
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
  }

  /* Helper for mobile hiding */
  @media (max-width: 380px) {
      .hide-mobile-xs {
          display: none;
      }
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'white',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '0.85rem'
            }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--color-success)' }}>Sales: ₹{payload[0].value}</span>
                    <span style={{ color: 'var(--color-danger)' }}>Expense: ₹{payload[1].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

const EmptyState = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: 'var(--color-text-muted)',
        height: '100%',
        textAlign: 'center'
    }}>
        <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--color-bg-body)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
        }}>
            <Inbox size={40} color="var(--color-primary)" strokeWidth={1.5} />
        </div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>No Transactions Found</h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '250px' }}>
            It looks like there's no activity for this period. Try selecting a different date.
        </p>
    </div>
);

const Reports = ({ setCurrentView, isActive }) => {
    const { transactions, loading, setViewDateRange, currentRange, getFinancialStats } = useTransactions();
    const [view, setView] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'uptodate'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [asyncStats, setAsyncStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Track the currently visible month in the calendar 
    const [activeCalendarDate, setActiveCalendarDate] = useState(selectedDate);

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    // Sync activeCalendarDate when selectedDate changes (so calendar opens to correct month)
    React.useEffect(() => {
        setActiveCalendarDate(selectedDate);
    }, [selectedDate]);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Navigation Handlers
    const handlePrev = (e) => {
        if (e) e.stopPropagation();
        if (view === 'weekly') {
            setSelectedDate(prev => subWeeks(prev, 1));
        } else if (view === 'monthly') {
            setSelectedDate(prev => subMonths(prev, 1));
        } else if (view === 'daily') {
            setSelectedDate(prev => subDays(prev, 1));
        }
    };

    const handleNext = (e) => {
        if (e) e.stopPropagation();
        const today = new Date();
        if (view === 'weekly') {
            const nextWeek = addWeeks(selectedDate, 1);
            if (startOfWeek(nextWeek, { weekStartsOn: 1 }) <= today) {
                setSelectedDate(prev => addWeeks(prev, 1));
            }
        } else if (view === 'monthly') {
            const nextMonth = addMonths(selectedDate, 1);
            if (startOfMonth(nextMonth) <= today) {
                setSelectedDate(prev => addMonths(prev, 1));
            }
        } else if (view === 'daily') {
            const nextDay = addDays(selectedDate, 1);
            if (startOfDay(nextDay) <= today) {
                setSelectedDate(prev => addDays(prev, 1));
            }
        }
    };

    // View Switch Handler
    const switchToView = (newView) => {
        if (newView === 'weekly' && view !== 'weekly') {
            // User requested "Week should open this week"
            setSelectedDate(new Date());
        }
        setView(newView);
    };

    // Check if "Next" should be disabled
    const isNextDisabled = useMemo(() => {
        const today = new Date();
        if (view === 'weekly') {
            const nextWeek = addWeeks(selectedDate, 1);
            return startOfWeek(nextWeek, { weekStartsOn: 1 }) > today;
        }
        if (view === 'monthly') {
            const nextMonth = addMonths(selectedDate, 1);
            return startOfMonth(nextMonth) > today;
        }
        // Daily limit
        if (view === 'daily') {
            const nextDay = addDays(selectedDate, 1);
            return startOfDay(nextDay) > today;
        }
        return false;
    }, [view, selectedDate]);

    const reportData = useMemo(() => {
        const now = new Date();
        let start, end;

        if (view === 'uptodate') {
            return transactions.filter(t => new Date(t.date) <= now)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        if (view === 'daily') {
            return transactions.filter(t => isSameDay(new Date(t.date), selectedDate))
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ensure sorting for daily too
        }

        const dateBase = selectedDate;

        if (view === 'weekly') {
            start = startOfWeek(dateBase, { weekStartsOn: 1 });
            end = endOfWeek(dateBase, { weekStartsOn: 1 });
        } else {
            // Monthly
            start = startOfMonth(dateBase);
            end = endOfMonth(dateBase);
        }

        return transactions.filter(t =>
            isWithinInterval(new Date(t.date), { start, end })
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, view, selectedDate]);


    // Helper to check for transaction on a specific date for calendar tile
    const hasTransaction = (date) => {
        return transactions.some(t => isSameDay(new Date(t.date), date));
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setView('daily');
        setShowCalendar(false);
    };

    // Effect to Sync Context with View
    React.useEffect(() => {
        if (!isActive) return;

        const now = selectedDate;
        let start, end;
        let shouldUseAsyncStats = false;

        if (view === 'uptodate') {
            shouldUseAsyncStats = true;
            const today = new Date();
            start = startOfDay(subDays(today, 7));
            end = endOfDay(today);
        } else if (view === 'daily') {
            // Fetch month data based on ACTIVE calendar view + Selected Date
            // This ensures we have dots for the month being viewed, AND data for the selected day list
            const startSelected = startOfMonth(now);
            const endSelected = endOfMonth(now);

            const startActive = startOfMonth(activeCalendarDate);
            const endActive = endOfMonth(activeCalendarDate);

            // Union range
            start = startActive < startSelected ? startActive : startSelected;
            end = endActive > endSelected ? endActive : endSelected;

        } else if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            // Monthly
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        if (start.toISOString() !== currentRange.start.toISOString() || end.toISOString() !== currentRange.end.toISOString()) {
            setViewDateRange(start, end);
        }

        if (shouldUseAsyncStats && !showAllHistory) {
            setStatsLoading(true);
            getFinancialStats(new Date(0), new Date()).then(stats => {
                setAsyncStats(stats);
                setStatsLoading(false);
            });
        } else {
            setAsyncStats(null);
        }

    }, [view, selectedDate, activeCalendarDate, setViewDateRange, currentRange.start, currentRange.end, isActive, getFinancialStats, showAllHistory]);

    // Dynamic Header Text
    const getHeaderText = () => {
        if (view === 'uptodate') return isMobile ? 'Up to Date' : 'All Time Up to Date';
        if (view === 'daily') return isMobile ? format(selectedDate, 'dd MMM yy') : `Daily: ${format(selectedDate, 'dd MMM yyyy')}`;

        if (view === 'monthly') {
            return isMobile
                ? `This Month (${format(selectedDate, "MMM ''yy")})`
                : `This Month (${format(selectedDate, 'MMMM yyyy')})`;
        }

        if (view === 'weekly') {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            const isCurrentWeek = isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 });

            // Mobile: "This Week (02 Feb - 08 Feb)" or "02 Feb - 08 Feb"
            const dateRange = `${format(start, 'dd MMM')} - ${format(end, 'dd MMM')}`;
            if (isMobile) {
                return isCurrentWeek ? `This Week (${dateRange})` : dateRange;
            }
            return isCurrentWeek ? `This Week (${dateRange})` : `Week of ${dateRange}`;
        }
        return 'Reports';
    };

    const getTitle = getHeaderText;
    const displayedTransactions = reportData;

    return (
        <div className="fade-in" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <style>{calendarStyles}</style>

            {/* 1. View Switcher & Date Nav - Responsive Flex/Grid */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: isMobile ? '12px' : '16px',
                width: '100%',
                flexShrink: 0,
                overflowX: isMobile ? 'auto' : 'visible',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                paddingBottom: isMobile ? '4px' : '0',
            }}>
                {/* UP TO DATE */}
                <button
                    onClick={() => switchToView('uptodate')}
                    style={{
                        padding: isMobile ? '8px 12px' : '12px 16px',
                        background: view === 'uptodate' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: view === 'uptodate' ? 'white' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        fontSize: isMobile ? '0.9rem' : '1.0rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px',
                        transition: 'all 0.2s',
                        boxShadow: view === 'uptodate' ? '0 4px 12px var(--color-primary-light-opacity)' : 'none',
                        height: isMobile ? '42px' : '48px',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                    }}
                >
                    <InfinityIcon size={isMobile ? 20 : 22} />
                    {isMobile ? 'All' : 'Up to Date'}
                </button>

                {/* WEEK - Dynamic Flex */}
                <div style={{
                    position: 'relative',
                    height: isMobile ? '42px' : '48px',
                    display: 'flex',
                    isolation: 'isolate',
                    flex: view === 'weekly' ? '2' : '1', // Grow when active
                    minWidth: isMobile ? '80px' : 'auto',
                    transition: 'flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <button
                        onClick={() => switchToView('weekly')}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: view === 'weekly' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                            color: view === 'weekly' ? 'white' : 'var(--color-text-main)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.9rem' : '1.0rem', // Increased font
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            transition: 'all 0.2s',
                            zIndex: 1,
                            padding: '0 4px'
                        }}
                    >
                        Week 🍩
                    </button>
                    {/* Navigation Arrows Overlay */}
                    {view === 'weekly' && (
                        <>
                            <button onClick={handlePrev} style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                padding: isMobile ? '0 16px' : '0 20px',  // Larger touch target
                                border: 'none',
                                background: 'transparent',
                                color: 'white',
                                borderTopLeftRadius: 'var(--radius-md)',
                                borderBottomLeftRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                zIndex: 5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ChevronLeft size={isMobile ? 20 : 22} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isNextDisabled}
                                style={{
                                    position: 'absolute', right: 0, top: 0, bottom: 0,
                                    padding: isMobile ? '0 16px' : '0 20px', // Larger touch target
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'white',
                                    borderTopRightRadius: 'var(--radius-md)',
                                    borderBottomRightRadius: 'var(--radius-md)',
                                    cursor: isNextDisabled ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: isNextDisabled ? 0.4 : 1,
                                    zIndex: 5
                                }}>
                                <ChevronRight size={isMobile ? 20 : 22} />
                            </button>
                        </>
                    )}
                </div>

                {/* MONTH - Dynamic Flex */}
                <div style={{
                    position: 'relative',
                    height: isMobile ? '42px' : '48px',
                    display: 'flex',
                    isolation: 'isolate',
                    flex: view === 'monthly' ? '2' : '1', // Grow when active
                    minWidth: isMobile ? '80px' : 'auto',
                    transition: 'flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <button
                        onClick={() => switchToView('monthly')}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: view === 'monthly' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                            color: view === 'monthly' ? 'white' : 'var(--color-text-main)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.9rem' : '1.0rem', // Increased font
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            transition: 'all 0.2s',
                            zIndex: 1,
                            padding: '0 4px'
                        }}
                    >
                        Month 🥐
                    </button>
                    {/* Navigation Arrows Overlay */}
                    {view === 'monthly' && (
                        <>
                            <button onClick={handlePrev} style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                padding: isMobile ? '0 16px' : '0 20px',
                                border: 'none',
                                background: 'transparent',
                                color: 'white',
                                borderTopLeftRadius: 'var(--radius-md)',
                                borderBottomLeftRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                zIndex: 5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ChevronLeft size={isMobile ? 20 : 22} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isNextDisabled}
                                style={{
                                    position: 'absolute', right: 0, top: 0, bottom: 0,
                                    padding: isMobile ? '0 16px' : '0 20px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'white',
                                    borderTopRightRadius: 'var(--radius-md)',
                                    borderBottomRightRadius: 'var(--radius-md)',
                                    cursor: isNextDisabled ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: isNextDisabled ? 0.4 : 1,
                                    zIndex: 5
                                }}>
                                <ChevronRight size={isMobile ? 20 : 22} />
                            </button>
                        </>
                    )}
                </div>

                {/* CALENDAR */}
                <button
                    onClick={() => {
                        if (view !== 'daily') {
                            setView('daily');
                            setShowCalendar(true);
                        } else {
                            setShowCalendar((prev) => !prev);
                        }
                    }}
                    style={{
                        height: isMobile ? '42px' : '48px', // Match new height
                        width: isMobile ? '42px' : '48px',
                        background: (showCalendar || view === 'daily') ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: (showCalendar || view === 'daily') ? 'white' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flex: '0 0 auto'
                    }}
                >
                    <CalendarIcon size={isMobile ? 20 : 22} />
                </button>
            </div>


            {/* 2. Header & Actions - Row 2 */}
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center', // Fix vertical alignment
                justifyContent: 'space-between',
                gap: '8px',
                flexShrink: 0
            }}>
                <h2 style={{
                    fontSize: isMobile ? '1rem' : '1.25rem', // Smaller on mobile
                    fontWeight: '700',
                    color: 'var(--color-text-main)',
                    letterSpacing: '-0.5px',
                    margin: 0,
                    marginRight: 'auto',
                    lineHeight: '1.2',
                    paddingRight: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {getHeaderText()}
                </h2>

                <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => setCurrentView('analytics')}
                        className="btn btn-premium-hover"
                        style={{
                            padding: isMobile ? '8px 10px' : '10px 16px',
                            background: 'transparent',
                            color: 'var(--color-text-main)',
                            border: '1px solid var(--color-border)',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <PieChartIcon size={isMobile ? 16 : 18} />
                        <span className={isMobile ? 'hide-mobile-xs' : ''}>Analytics</span>
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--color-bg-surface)', // Fix for ghost button
                            border: '1px solid var(--color-border)',
                            padding: isMobile ? '8px 10px' : '10px 16px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            fontWeight: '600',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Download size={isMobile ? 16 : 18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Calendar Calendar */}
            {showCalendar && (
                <div className="scale-in" style={{ marginBottom: '24px', flexShrink: 0 }}>
                    <Calendar
                        onChange={handleDateChange}
                        onActiveStartDateChange={({ activeStartDate }) => setActiveCalendarDate(activeStartDate)}
                        value={selectedDate}
                        maxDate={new Date()}
                        tileContent={({ date, view: calendarView }) =>
                            calendarView === 'month' && hasTransaction(date) ? <div className="tile-dot"></div> : null
                        }
                    />
                </div>
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            {/* Stats and Table Section - Fill Vertical Space */}
            <div className="card" style={{
                padding: 0,
                overflow: 'hidden',
                flex: '1 1 0', // Vertical Fill
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                marginBottom: '20px'
            }}>
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, backgroundColor: 'var(--color-bg-surface-transparent)',
                        zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '40px' }}> {/* Padding needed for scroll end */}
                    {reportData.length > 0 ? (
                        <>
                            <div style={{ borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-surface)', zIndex: 10 }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr)', // Even grid
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    padding: '16px 8px'
                                }}>
                                    {[
                                        {
                                            label: 'Total Sales 🧁',
                                            value: asyncStats ? asyncStats.totalSales : reportData.reduce((acc, curr) => acc + (curr.type === 'sale' ? curr.amount : 0), 0),
                                            color: 'var(--color-success)',
                                            align: 'left',
                                        },
                                        {
                                            label: 'Total Expense 💸',
                                            value: asyncStats ? asyncStats.totalExpense : reportData.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : 0), 0),
                                            color: 'var(--color-danger)',
                                            align: 'center',
                                        },
                                        {
                                            label: 'Net Profit 💼',
                                            value: asyncStats ? asyncStats.netProfit : reportData.reduce((acc, curr) => acc + (curr.type === 'sale' ? curr.amount : -curr.amount), 0),
                                            color: 'var(--color-text-main)',
                                            align: 'right',
                                        }
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: item.align, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.label}</div>
                                            <div style={{ color: item.color, fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
                                                {statsLoading ? '...' : `₹ ${item.value.toFixed(2)}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <table style={{
                                width: '100%',
                                maxWidth: '600px',
                                margin: '0 auto',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                                tableLayout: 'fixed'
                            }}>
                                <thead style={{ position: 'sticky', top: '75px', backgroundColor: 'var(--color-bg-surface)', zIndex: 5, boxShadow: '0 1px 0 var(--color-border)' }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '12px 16px', width: '90px', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', width: '110px', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedTransactions.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--color-bg-body)', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{format(new Date(t.date), 'dd/MM')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{format(new Date(t.date), 'h:mm a')}</div>
                                            </td>
                                            <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--color-text-main)' }}>
                                                {t.description}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', fontWeight: '600' }}>
                                                <div style={{ color: t.type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                    {t.type === 'sale' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Load More / Show Full History logic */}
                                    {!showAllHistory && view === 'uptodate' && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '16px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => {
                                                        setShowAllHistory(true);
                                                        // When showing all, we need to instruct the context to fetch EVERYTHING.
                                                        setViewDateRange(new Date(0), new Date()); // Reset range to global
                                                    }}
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', borderRadius: '12px', fontSize: '0.9rem' }}
                                                >
                                                    Show All History
                                                </button>
                                                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    Showing last 7 days.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        !loading && <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
