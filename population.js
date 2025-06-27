import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

// --- Embedded CSV Data ---
// The correct world population data is now embedded to avoid fetch errors.
const CSV_DATA = `Entity,Code,Year,Population (historical estimates and future projections)
World,OWID_WRL,-10000,4501152
World,OWID_WRL,-9000,5687125
World,OWID_WRL,-8000,7314623
World,OWID_WRL,-7000,9651703
World,OWID_WRL,-6000,13278309
World,OWID_WRL,-5000,19155698
World,OWID_WRL,-4000,28859174
World,OWID_WRL,-3000,44577880
World,OWID_WRL,-2000,72685064
World,OWID_WRL,-1000,110530464
World,OWID_WRL,0,232268832
World,OWID_WRL,100,237052192
World,OWID_WRL,200,240762160
World,OWID_WRL,300,227702848
World,OWID_WRL,400,241697008
World,OWID_WRL,500,253395808
World,OWID_WRL,600,271638944
World,OWID_WRL,700,278346080
World,OWID_WRL,800,285870176
World,OWID_WRL,900,311142688
World,OWID_WRL,1000,323462624
World,OWID_WRL,1500,503051104
World,OWID_WRL,1600,516147616
World,OWID_WRL,1700,595456896
World,OWID_WRL,1800,954892352
World,OWID_WRL,1820,1065623616
World,OWID_WRL,1830,1148205440
World,OWID_WRL,1840,1209754496
World,OWID_WRL,1850,1287033856
World,OWID_WRL,1950,2493092801
World,OWID_WRL,1951,2536926981
World,OWID_WRL,1952,2584086282
World,OWID_WRL,1953,2634106196
World,OWID_WRL,1954,2685894824
World,OWID_WRL,1955,2740213742
World,OWID_WRL,1960,3015470858
World,OWID_WRL,1965,3334533671
World,OWID_WRL,1970,3694683753
World,OWID_WRL,1975,4070735208
World,OWID_WRL,1980,4447606162
World,OWID_WRL,1985,4868943409
World,OWID_WRL,1990,5327803039
World,OWID_WRL,1995,5758878939
World,OWID_WRL,2000,6171702952
World,OWID_WRL,2005,6586970109
World,OWID_WRL,2010,7021732097
World,OWID_WRL,2015,7470491849
World,OWID_WRL,2020,7887001253
World,OWID_WRL,2021,7954448327
World,OWID_WRL,2022,8021407128
World,OWID_WRL,2023,8091734853
World,OWID_WRL,2024,8161972496
World,OWID_WRL,2025,8231613055
World,OWID_WRL,2030,8569124874
World,OWID_WRL,2040,9177190161
World,OWID_WRL,2050,9664378554
World,OWID_WRL,2060,9989232258
World,OWID_WRL,2070,10189241908
World,OWID_WRL,2080,10283077976
World,OWID_WRL,2090,10271565034
World,OWID_WRL,2100,10180160680
`;

// --- Constants ---
const END_YEAR = 2025;
const INITIAL_Y_MAX = 2e9; // Set initial Y-axis max to 2 Billion

// --- Helper Functions ---
const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const obj = {};
        headers.forEach((header, index) => {
            let value = values[index] ? values[index].trim() : '';
            obj[header] = value;
        });
        data.push(obj);
    }
    return data;
};

const formatYAxis = (tickItem) => {
    if (tickItem >= 1e9) return `${(tickItem / 1e9).toFixed(0)}B`;
    if (tickItem >= 1e6) return `${(tickItem / 1e6).toFixed(0)}M`;
    if (tickItem >= 1e3) return `${(tickItem / 1e3).toFixed(0)}K`;
    return tickItem.toString();
};

const formatXAxis = (tickItem) => {
    if (tickItem < 0) return `${Math.abs(tickItem)} BC`;
    if (tickItem > 9999) return `${(tickItem / 1000).toFixed(0)}k`;
    return tickItem.toString();
};

// --- React Components ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800">{`Year: ${formatXAxis(Math.round(label))}`}</p>
                <div style={{ color: '#8884d8' }}>
                    <span className="font-semibold">Population: </span>
                    <span>{`${Math.round(payload[0].value).toLocaleString()}`}</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function App() {
    // --- State Management ---
    const [year, setYear] = useState(-10000);
    const [isPlaying, setIsPlaying] = useState(false);
    const [yDomainMax, setYDomainMax] = useState(INITIAL_Y_MAX);

    // --- Data Processing ---
    const chartData = useMemo(() => {
        const parsedData = parseCSV(CSV_DATA);
        return parsedData
            .filter(d => d.Entity === 'World' && d['Population (historical estimates and future projections)'] && parseInt(d.Year, 10) <= END_YEAR)
            .map(d => ({
                year: parseInt(d.Year, 10),
                population: parseInt(d['Population (historical estimates and future projections)'], 10)
            }))
            .sort((a, b) => a.year - b.year);
    }, []);

    const { minYear, maxYear } = useMemo(() => {
        if (!chartData.length) return { minYear: -10000, maxYear: END_YEAR };
        return {
            minYear: chartData[0].year,
            maxYear: END_YEAR,
        };
    }, [chartData]);
    
    // --- Interpolated Data for Smoother Animation ---
    const displayedData = useMemo(() => {
        if (year <= minYear) return [chartData[0]];
        if (year >= maxYear) return chartData.filter(d => d.year <= maxYear);

        const pastData = chartData.filter(d => d.year <= year);
        const nextPoint = chartData.find(d => d.year > year);
        const prevPoint = pastData[pastData.length - 1];

        if (!nextPoint || !prevPoint) return pastData;

        const yearRange = nextPoint.year - prevPoint.year;
        if (yearRange === 0) return pastData;
        
        const popRange = nextPoint.population - prevPoint.population;
        const progress = (year - prevPoint.year) / yearRange;
        const interpolatedPop = prevPoint.population + (popRange * progress);
        
        const interpolatedPoint = { year, population: interpolatedPop };
        
        return [...pastData, interpolatedPoint];

    }, [chartData, year, minYear, maxYear]);

    const currentMaxPop = useMemo(() => {
        if (!displayedData.length) return 0;
        return Math.max(...displayedData.map(d => d.population));
    }, [displayedData]);
    
    // --- Y-Axis Ticks ---
    const yAxisTicks = useMemo(() => {
        if (!yDomainMax) return [];
        // Show ticks for every 2 billion if the max is high, otherwise every 1 billion
        const step = yDomainMax > 4e9 ? 2e9 : 1e9;
        const numLines = Math.floor(yDomainMax / step);
        return Array.from({ length: numLines }, (_, i) => (i + 1) * step);
    }, [yDomainMax]);

    // --- Animation & Y-Axis Zoom Logic ---
    useEffect(() => {
        const targetMax = Math.max(INITIAL_Y_MAX, Math.ceil(currentMaxPop / 1e9) * 1e9);
        if (targetMax > yDomainMax) {
            let animationFrameId;
            const animate = () => {
                setYDomainMax(prevMax => {
                    const diff = targetMax - prevMax;
                    const nextMax = prevMax + diff * 0.05;
                    if (diff < 1000) return targetMax;
                    animationFrameId = requestAnimationFrame(animate);
                    return nextMax;
                });
            };
            animationFrameId = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrameId);
        }
    }, [currentMaxPop, yDomainMax]);

    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                setYear(prevYear => {
                    const increment = prevYear < 1800 ? 40 : 1;
                    const nextYear = prevYear + increment;
                    if (nextYear >= maxYear) {
                        setIsPlaying(false);
                        return maxYear;
                    }
                    return nextYear;
                });
            }, 16);
            return () => clearInterval(interval);
        }
    }, [isPlaying, maxYear]);

    // --- Event Handlers ---
    const handlePlayPause = useCallback(() => {
        if (year >= maxYear) {
            setYear(minYear);
            setYDomainMax(INITIAL_Y_MAX);
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, year, minYear, maxYear]);

    const handleSliderChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        setYear(newYear);
        if (isPlaying) setIsPlaying(false);
        const maxPopAtYear = Math.max(1, ...chartData.filter(d => d.year <= newYear).map(d => d.population));
        const targetMax = Math.max(INITIAL_Y_MAX, Math.ceil(maxPopAtYear / 1e9) * 1e9);
        setYDomainMax(targetMax);
    };

    // --- Render Logic ---
    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-8 flex flex-col items-center font-sans">
            <header className="w-full max-w-7xl text-center mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-500">
                    World Population Growth
                </h1>
                <p className="text-gray-400 mt-2">10,000 BC to {END_YEAR} AD</p>
            </header>

            <div className="w-full max-w-7xl h-[60vh] md:h-[70vh] bg-gray-800/50 p-4 rounded-xl shadow-2xl border border-gray-700">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={displayedData}
                        margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorPopulation" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis 
                            dataKey="year" 
                            stroke="#A0AEC0" 
                            tick={{ fill: '#A0AEC0' }}
                            domain={[minYear, maxYear]}
                            type="number"
                            tickFormatter={formatXAxis}
                        />
                        <YAxis 
                            stroke="#A0AEC0"
                            tickFormatter={formatYAxis}
                            domain={[0, yDomainMax]}
                            allowDataOverflow={true}
                            type="number"
                            ticks={yAxisTicks} // Use the calculated ticks
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="population"
                            name="World Population"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorPopulation)"
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <footer className="w-full max-w-4xl mt-8 p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700">
                <div className="flex items-center justify-center space-x-4">
                    <button
                        onClick={handlePlayPause}
                        className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                    >
                        {isPlaying ? (
                             <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"></path></svg>
                        ) : (
                             <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6V4z"></path></svg>
                        )}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <div className="flex-grow flex items-center space-x-4">
                        <span className="text-gray-400 text-sm font-mono w-20 text-center">{formatXAxis(minYear)}</span>
                        <input
                            type="range"
                            min={minYear}
                            max={maxYear}
                            step="10"
                            value={year}
                            onChange={handleSliderChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                         <span className="text-gray-400 text-sm font-mono w-20 text-center">{formatXAxis(maxYear)}</span>
                    </div>
                     <span className="text-xl font-bold text-sky-400 w-28 text-center">{formatXAxis(Math.min(year, maxYear))}</span>
                </div>
            </footer>
        </div>
    );
}
