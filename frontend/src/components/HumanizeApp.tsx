import React, { useState } from 'react';
import { Wand2, Settings, BarChart3 } from 'lucide-react';
import { humanizationApi } from '@/services/api';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Style, Intensity, ProcessingStatus, HumanizeResponse } from '@/types';

export const HumanizeApp: React.FC = () => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<Style>('professional');
  const [intensity, setIntensity] = useState<Intensity>('aggressive');
  const [preserveFormatting, setPreserveFormatting] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [result, setResult] = useState<HumanizeResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleHumanize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to humanize');
      return;
    }

    if (text.length < 10) {
      setError('Text must be at least 10 characters long');
      return;
    }

    setStatus('processing');
    setError('');
    setResult(null);

    try {
      const response = await humanizationApi.humanize({
        text: text.trim(),
        style,
        intensity,
        preserveFormatting,
      });

      setResult(response);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to humanize text');
      setStatus('error');
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError('');
    setStatus('idle');
  };

  const handleExample = () => {
    setText(
      'The implementation of this advanced artificial intelligence system demonstrates significant improvements in operational efficiency and effectiveness. Furthermore, the comprehensive methodology utilized in this research provides substantial evidence for the viability of the proposed technological approach. Therefore, this study contributes meaningfully to the existing academic literature on machine learning applications. It is important to note that the results obtained through this investigation establish a foundation for future developments in the field.'
    );
  };

  return (
    <div className='min-h-screen py-8 bg-gray-50'>
      <div className='max-w-6xl px-4 mx-auto sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <Wand2 className='w-8 h-8 text-blue-600' />
            <h1 className='text-4xl font-bold text-gray-900'>HumanizeAI</h1>
          </div>
          <p className='max-w-2xl mx-auto text-xl text-gray-600'>
            Made with love, for Cristal ❤️
          </p>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Input Section */}
          <div className='card'>
            <div className='flex items-center gap-2 mb-4'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Input Text
              </h2>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder='Paste your AI-generated text here to humanize it...'
              className='h-64 mb-4 textarea-custom'
              maxLength={3000}
            />

            <div className='flex items-center justify-between mb-4 text-sm text-gray-500'>
              <span>{text.length}/3000 characters</span>
              <button
                onClick={handleExample}
                className='text-blue-600 underline hover:text-blue-700'
              >
                Try example text
              </button>
            </div>

            {/* Controls */}
            <div className='mb-6 space-y-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Settings className='w-4 h-4 text-gray-500' />
                <span className='font-medium text-gray-700'>Settings</span>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>
                    Style
                  </label>
                  <select
                    value={style}
                    onChange={e => setStyle(e.target.value as Style)}
                    className='w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='professional'>Professional</option>
                  </select>
                  <p className='mt-1 text-xs text-gray-500'>
                    Only professional style supported
                  </p>
                </div>

                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>
                    Intensity
                  </label>
                  <select
                    value={intensity}
                    onChange={e => setIntensity(e.target.value as Intensity)}
                    className='w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='aggressive'>
                      Aggressive (Balanced Synonyms)
                    </option>
                  </select>
                  <p className='mt-1 text-xs text-gray-500'>
                    Uses WordsAPI with smart filtering for readability
                  </p>
                </div>
              </div>

              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preserveFormatting}
                  onChange={e => setPreserveFormatting(e.target.checked)}
                  className='text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>
                  Preserve formatting
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3'>
              <button
                onClick={handleHumanize}
                disabled={status === 'processing' || !text.trim()}
                className='flex items-center justify-center flex-1 gap-2 button-primary'
              >
                {status === 'processing' ? (
                  <>
                    <LoadingSpinner size='sm' />
                    Humanizing...
                  </>
                ) : (
                  <>
                    <Wand2 className='w-4 h-4' />
                    Humanize Text
                  </>
                )}
              </button>

              <button onClick={handleClear} className='button-secondary'>
                Clear
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Humanized Text
              </h2>
              {result && <CopyButton text={result.humanizedText} />}
            </div>

            {status === 'idle' && (
              <div className='flex items-center justify-center h-64 text-gray-500 border-2 border-gray-300 border-dashed rounded-lg'>
                Your humanized text will appear here
              </div>
            )}

            {status === 'processing' && (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <LoadingSpinner size='lg' className='mx-auto mb-4' />
                  <p className='text-gray-600'>Processing your text...</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center text-red-600'>
                  <p className='font-medium'>Error</p>
                  <p className='text-sm'>{error}</p>
                </div>
              </div>
            )}

            {result && status === 'success' && (
              <>
                <textarea
                  value={result.humanizedText}
                  readOnly
                  className='h-64 mb-4 textarea-custom bg-gray-50'
                />

                {/* Statistics */}
                <div className='p-4 rounded-lg bg-gray-50'>
                  <div className='flex items-center gap-2 mb-3'>
                    <BarChart3 className='w-4 h-4 text-gray-500' />
                    <span className='font-medium text-gray-700'>
                      Statistics
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
                    <div>
                      <p className='text-gray-500'>Changes Made</p>
                      <p className='font-medium'>
                        {result.statistics.changesCount}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Words</p>
                      <p className='font-medium'>
                        {result.statistics.originalWordCount} →{' '}
                        {result.statistics.humanizedWordCount}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Readability</p>
                      <p className='font-medium'>
                        {result.statistics.readabilityScore.toFixed(1)}/10
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Processing Time</p>
                      <p className='font-medium'>
                        {result.processingTime.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='mt-12 text-center text-gray-500'>
          <p>HumanizeAI - Personal Use • Free Text Humanization</p>
        </div>
      </div>
    </div>
  );
};
