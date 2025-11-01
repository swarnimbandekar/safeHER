import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Droplets, Heart, Smile, Frown, Meh } from 'lucide-react';

export function PinkRelief() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'tips'>('tracker');
  const [cycleDay, setCycleDay] = useState(14);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('happy');

  const availableSymptoms = [
    'Cramps',
    'Headache',
    'Fatigue',
    'Bloating',
    'Mood swings',
    'Acne',
    'Back pain',
    'Nausea',
  ];

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  return (
    <Layout title="Pink Relief">
      <div className="px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tracker'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Period Tracker
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tips'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Daily Tips
          </button>
        </div>

        {activeTab === 'tracker' ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cycle Day {cycleDay}</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What day of your cycle are you on?
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={cycleDay}
                  onChange={(e) => setCycleDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Day 1</span>
                  <span>Day 30</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How are you feeling today?</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setMood('happy')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      mood === 'happy' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' 
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Smile className="w-6 h-6 text-yellow-500" />
                    <span className="text-sm font-medium">Happy</span>
                  </button>
                  
                  <button
                    onClick={() => setMood('neutral')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      mood === 'neutral' 
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' 
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Meh className="w-6 h-6 text-gray-500" />
                    <span className="text-sm font-medium">Neutral</span>
                  </button>
                  
                  <button
                    onClick={() => setMood('sad')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      mood === 'sad' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Frown className="w-6 h-6 text-blue-500" />
                    <span className="text-sm font-medium">Sad</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Any symptoms today?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        symptoms.includes(symptom)
                          ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Today's Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Flow Prediction</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Medium flow expected today</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Self-Care Tip</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Try a warm bath to ease cramps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stay Hydrated</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Drink at least 8 glasses of water today. Staying hydrated can help reduce bloating and fatigue.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Gentle Exercise</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Try light stretching or yoga to help with cramps and improve your mood.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nutrition Tip</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Include iron-rich foods like spinach and lean meats to combat fatigue.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mindfulness</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Practice deep breathing or meditation for 5-10 minutes to reduce stress and anxiety.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}