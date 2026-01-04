import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, BarChart2, Calendar as CalendarIcon, Inbox } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Override some calendar styles
const calendarStyles = `
  .react-calendar {
    width: 100%;
    background: white;
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
    background: none;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 8px;
    color: var(--color-primary);
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: var(--color-bg-body);
    border-radius: var(--radius-sm);
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

const EmptyState = ({ message }) => (
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

const Reports = () => {
    const { transactions } = useTransactions();
    const [view, setView] = useState('weekly'); // 'weekly', 'monthly', 'daily'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showChart, setShowChart] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    const reportData = useMemo(() => {
        const now = new Date();
        let start, end;

        if (view === 'daily') {
            return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
        }

        if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        return transactions.filter(t =>
            isWithinInterval(new Date(t.date), { start, end })
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, view, selectedDate]);

    // Prepare data for chart
    const chartData = useMemo(() => {
        const groups = {};
        reportData.slice().reverse().forEach(t => { // Reverse to show chronological left-to-right
            const dateKey = format(new Date(t.date), 'dd/MM');
            if (!groups[dateKey]) groups[dateKey] = { name: dateKey, sales: 0, expense: 0 };

            if (t.type === 'sale') groups[dateKey].sales += t.amount;
            else groups[dateKey].expense += t.amount;
        });
        return Object.values(groups);
    }, [reportData]);

    // Helper to check for transaction on a specific date for calendar tile
    const hasTransaction = (date) => {
        return transactions.some(t => isSameDay(new Date(t.date), date));
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setView('daily');
        setShowCalendar(false); // Close calendar after selection
    };

    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            let title = `${view === 'weekly' ? 'Weekly' : view === 'monthly' ? 'Monthly' : 'Daily'} Report`;
            if (view === 'daily') title += ` (${format(selectedDate, 'dd/MM/yyyy')})`;

            doc.text(title, 14, 15);

            const tableColumn = ["Date", "Description", "Type", "Amount"];
            const tableRows = [];

            reportData.forEach(t => {
                const ticketData = [
                    format(new Date(t.date), 'dd/MM/yyyy h:mm a'),
                    t.description,
                    t.type,
                    t.amount.toFixed(2)
                ];
                tableRows.push(ticketData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20
            });

            doc.save(`report_${view}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to export PDF: " + error.message);
        }
    };

    const toggleView = (newView) => {
        if (newView === 'daily') {
            setShowCalendar(!showCalendar);
            if (view !== 'daily') setView('daily');
        } else {
            setView(newView);
            setShowCalendar(false);
        }
    };

    const getTitle = () => {
        if (view === 'weekly') return "This Week's Report";
        if (view === 'monthly') return "This Month's Report";
        return `Report for ${format(selectedDate, 'dd MMM yyyy')}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <style>{calendarStyles}</style>

            {/* Controls Header - Static (Flex item) */}
            <style>{`
                /* Hard override for Recharts focus outline */
                .recharts-wrapper:focus,
                .recharts-wrapper:active,
                .recharts-surface:focus,
                .recharts-layer:focus,
                div[class^="recharts"]:focus {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                     -webkit-tap-highlight-color: transparent !important;
                }
            `}</style>
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                flexShrink: 0
            }}>
                {/* Calendar Toggle Button */}
                <button
                    onClick={() => toggleView('daily')}
                    className={`btn ${view === 'daily' ? 'btn-primary' : ''}`}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: view !== 'daily' ? 'white' : undefined,
                        border: view !== 'daily' ? '1px solid var(--color-border)' : undefined
                    }}
                    title="Select Date"
                >
                    <CalendarIcon size={18} /> Daily
                </button>

                <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                    <button
                        className={`btn ${view === 'weekly' ? 'btn-primary' : ''}`}
                        onClick={() => toggleView('weekly')}
                        style={{ flex: 1, fontSize: '0.9rem', padding: '8px 12px', backgroundColor: view !== 'weekly' ? 'white' : undefined, border: view !== 'weekly' ? '1px solid var(--color-border)' : undefined }}
                    >
                        Week
                    </button>
                    <button
                        className={`btn ${view === 'monthly' ? 'btn-primary' : ''}`}
                        onClick={() => toggleView('monthly')}
                        style={{ flex: 1, fontSize: '0.9rem', padding: '8px 12px', backgroundColor: view !== 'monthly' ? 'white' : undefined, border: view !== 'monthly' ? '1px solid var(--color-border)' : undefined }}
                    >
                        Month
                    </button>
                </div>

                <button
                    onClick={() => setShowChart(!showChart)}
                    className="btn"
                    style={{
                        padding: '8px',
                        backgroundColor: showChart ? 'var(--color-primary-light)' : 'white',
                        color: showChart ? 'white' : 'var(--color-primary)',
                        border: '1px solid var(--color-border)',
                        display: view === 'daily' ? 'none' : 'flex' // Hide chart toggle in daily view if not needed, or keep it.
                    }}
                    title="Toggle Chart"
                >
                    <BarChart2 size={20} />
                </button>

                <button
                    onClick={exportPDF}
                    className="btn"
                    style={{ padding: '8px', backgroundColor: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                    title="Export PDF"
                >
                    <Download size={20} />
                </button>
            </div>

            {/* Calendar Widget (Conditional) */}
            {showCalendar && (
                <div style={{ animation: 'fadeIn 0.2s ease-out', flexShrink: 0 }}>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        maxDate={new Date()}
                        tileContent={({ date, view }) => view === 'month' && hasTransaction(date) ? <div className="tile-dot"></div> : null}
                    />
                </div>
            )}

            {/* Chart Section (Collapsible & Hidden on Daily by default unless meaningful) */}
            {showChart && view !== 'daily' && (
                <div className="card" style={{ marginBottom: '16px', height: '240px', flexShrink: 0, paddingBottom: '10px' }}>
                    <div className="chart-scroll-container" style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden', outline: 'none' }}>
                        <div style={{ width: `${Math.max(100, chartData.length * 60)}%`, minWidth: '100%', height: '100%', outline: 'none' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                        dy={10}
                                        interval={0} // Show all ticks if possible, scrolling handles space
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Bar dataKey="sales" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="expense" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* View Title */}
            <h3 style={{ marginBottom: '16px', flexShrink: 0 }}>{getTitle()}</h3>

            {/* Table Section (Flex 1) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {reportData.length > 0 ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '16px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                                {/* Aggregates (Sticky at top of card) */}
                                {[
                                    { label: 'Total Sales', value: reportData.reduce((acc, curr) => acc + (curr.type === 'sale' ? curr.amount : 0), 0), color: 'var(--color-success)' },
                                    { label: 'Total Expense', value: reportData.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : 0), 0), color: 'var(--color-danger)' },
                                    { label: 'Net Profit', value: reportData.reduce((acc, curr) => acc + (curr.type === 'sale' ? curr.amount : -curr.amount), 0), color: 'inherit' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
                                        <div style={{ color: item.color, fontWeight: 'bold' }}>₹{item.value.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ position: 'sticky', top: '75px', backgroundColor: 'var(--color-bg-surface)', zIndex: 5, boxShadow: '0 1px 0 var(--color-border)' }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Date</th>
                                        <th style={{ padding: '8px' }}>Desc</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--color-bg-body)' }}>
                                            <td style={{ padding: '8px' }}>
                                                <div>{format(new Date(t.date), 'dd/MM')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{format(new Date(t.date), 'h:mm a')}</div>
                                            </td>
                                            <td style={{ padding: '8px' }}>{t.description}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', color: t.type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {t.type === 'sale' ? '+' : '-'}₹{t.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
