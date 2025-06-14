# Daily Progress Tracker

A modern, responsive web application built with Next.js, TypeScript, and Tailwind CSS for tracking daily tasks and progress.

## Features

-   ✅ **Task Management**: Organize tasks by time blocks (Morning, Afternoon, Evening)
-   📊 **Progress Tracking**: Visual progress indicators and completion percentages
-   📈 **Analytics**: Charts showing progress over time with Chart.js
-   🏆 **Streak Tracking**: Monitor consecutive days of high performance
-   💾 **Local Storage**: Data persists between sessions
-   🌙 **Dark Mode**: Automatic dark/light theme support
-   📱 **Responsive**: Works on desktop, tablet, and mobile
-   📤 **Export**: Download progress data as CSV

## Tech Stack

-   **Framework**: Next.js 14 with App Router
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Charts**: Chart.js with react-chartjs-2
-   **Icons**: Lucide React
-   **State Management**: Custom hooks with localStorage

## Getting Started

1. **Clone and install:**

    ```bash
    git clone <repository-url>
    cd daily-progress-tracker
    npm install
    ```

2. **Run development server:**

    ```bash
    npm run dev
    ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and types
└── data/               # Static data (tasks)
```

## Usage

1. **Select a date** using the date picker or click "Today"
2. **Check off tasks** as you complete them throughout the day
3. **View progress** in the circular progress indicator and category breakdown
4. **Track trends** using the progress chart
5. **Analyze performance** with insights and streak statistics
6. **Export data** to CSV for external analysis

## Customization

-   **Add/modify tasks**: Edit `src/data/tasks.ts`
-   **Change styling**: Update Tailwind classes or CSS variables
-   **Add features**: Create new components and hooks

## License

MIT License
