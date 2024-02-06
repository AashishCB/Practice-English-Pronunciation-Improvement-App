import {
  Alert,
  PermissionsAndroid,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as React from 'react';
import {useCallback, useState} from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import {domain_url} from '../core/constants/Backend';
import {Mic, StopCircle} from 'react-native-feather';
import Tts from 'react-native-tts';

const audioRecorderPlayer = new AudioRecorderPlayer();

export function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [audioPath, setAudioPath] = useState('');

  let recordingPath = RNFS.ExternalDirectoryPath + '/hello.mp4'; // Set your file path accordingly
  const responseFilePath = RNFS.ExternalDirectoryPath + '/responses.txt';
  const requestAudioAndStoragePermission = async () => {
    try {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      if (
        grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Recording permission granted');
        // Your code to start recording can go here
      } else {
        console.log('Recording permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const clearRecordingTimer = () => {
    if (recordingTimer) {
      console.log('clearing Interval');
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };
  const startRecording = async () => {
    try {
      await requestAudioAndStoragePermission();
      setIsRecording(true);
      const recording = await audioRecorderPlayer.startRecorder();
      setupRecordingTimer();
      setAudioPath(recording);
      console.log('Recording---->', recording);
    } catch (error) {
      console.log(error);
      setIsRecording(false);
    }
  };

  const setupRecordingTimer = () => {
    setRecordingTimer(
      setInterval(async () => {
        const recordin = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        console.log('Recording --->', recordin);
        await saveRecording(audioPath);
        const recording = await audioRecorderPlayer.startRecorder();
        await sendRecordingToAPI(recordin);
      }, 10000),
    );
  };
  const stopRecording = async () => {
    try {
      if (isRecording) {
        clearRecordingTimer();
        const recording = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        console.log('Recording --->', recording);
        setIsRecording(false);
        await saveRecording(audioPath);
        await sendRecordingToAPI(recording);
      }
    } catch (error) {
      console.log('stop recording error -->', error);
    }
  };

  const sendRecordingToAPI = async (recording: string) => {
    console.log(recording);
    const formData = new FormData();
    formData.append('file', {
      uri: 'file://' + recordingPath,
      type: 'audio/m4a',
      name: 'sound.m4a',
    });

    const options = {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const response = await fetch(domain_url, options);
      const data = await response.json();
      console.log('Response from API:', data);
      const formattedData = `${data.data.replace(/"/g, '')}`;
      await RNFS.appendFile(responseFilePath, formattedData, 'utf8');
      setTranscribedText(transcribedText + data.data);
    } catch (error) {
      console.log('Error sending recording to API:', error);
    }
  };
  const saveRecording = async (recordedFile) => {
    try {
      await RNFS.moveFile(
        'file:////data/user/0/com.pronunciation_improvement_app/cache/sound.mp4',
        recordingPath,
      );
      console.log('Audio file saved successfully');
    } catch (error) {
      console.log('Error saving audio file:', error);
    }
  };
  const readResponseFile = useCallback(async () => {
    try {
      const fileContent = await RNFS.readFile(responseFilePath, 'utf8');
      setTranscribedText(fileContent);
    } catch (error) {
      console.log('Please Record Something First');
    } finally {
      console.log('Finally');
    }
  }, [responseFilePath]);
  const compareParagraphs = (paragraph1: string, paragraph2: string) => {
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .replace(/[.,/#!$?%^&*;:{}=\-_`~()\s]+/g, ' ')
        .trim();
    const words1 = normalizeText(paragraph1).split(/\s+/);
    const words2 = normalizeText(paragraph2).split(/\s+/);

    const countWords = (words: (string | number)[]) => {
      const wordCount = {};
      words.forEach((word: string | number) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      return wordCount;
    };

    const wordCount1: {} = countWords(words1);
    const wordCount2: {} = countWords(words2);

    const unmatchedWords = Object.keys(wordCount2).filter(
      word => (wordCount2[word] || 0) > (wordCount1[word] || 0),
    );
    const missingWords = Object.keys(wordCount1).filter(
      word => (wordCount1[word] || 0) > (wordCount2[word] || 0),
    );

    return {
      'Unmatched Words': unmatchedWords,
      'Missing Words': missingWords,
    };
  };

  const MismatchedWords = async () => {
    const showSuccessMessage = () => {
      Alert.alert(
        'Perfect Pronunciations',
        'The input and transcription content match.',
        [
          {
            text: 'Ok',
            style: 'default',
          },
        ],
        {
          cancelable: true,
        },
      );
    };
    const showMismatchMessage = (result) => {
      Alert.alert(
        'Mismatch words found',
        ...result['Unmatched Words'],
        [
          {
            text: 'Ok',
            style: 'default',
          },
        ],
        {
          cancelable: true,
        },
      );
    };

    RNFS.readFile(responseFilePath, 'utf8')
      .then(fileContent => {
        if (fileContent.trim() === '') {
          console.log('Response file is empty');
          return;
        }
        console.log('Text input value', textInputValue);
        const result = compareParagraphs(textInputValue, fileContent);

        console.log(result['Unmatched Words']);
        if (result['Unmatched Words'].length === 0) {
          showSuccessMessage();
        } else {
          const highlightedText = fileContent
            .split(/\s+/)
            .map((word, index) => (
              <Text
                style={
                  result['Unmatched Words'].includes(word)
                    ? styles.transcriptionContainer.highlightedWord
                    : {}
                }
                key={index}>
                {word}{' '}
              </Text>
            ));
          setTranscribedText(highlightedText);
          showMismatchMessage(result);
        }
      })
      .catch(error => {
        console.log('Error reading file:', error);
      });
  };

  const clearResponseFile = async () => {
    try {
      await RNFS.unlink(responseFilePath);
      setTranscribedText('');
      console.log('Responses file cleared');
    } catch (error) {
      console.log('Error clearing responses file:', error);
    }
  };

  const handleButtonPress = () => {
    if (isRecording) {
      stopRecording().then(() => console.log('Pressed Stop Recording'));
    } else {
      startRecording().then(() => console.log('Pressed Start Recording'));
    }
  };
  const handleTextToSpeech = () => {
    if (textInputValue) {
      Tts.speak(textInputValue, { androidParams: { KEY_PARAM_PAN: -1, KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' } });
    }
  };
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        value={textInputValue}
        onChangeText={text => setTextInputValue(text)}
        placeholder="Add text Content to read and compare from..."
        multiline={true}
        numberOfLines={22}
      />
      <View style={styles.pronunciation_container}>
        <Pressable style={styles.recording_button} onPress={handleButtonPress}>
          {isRecording ? (
            <StopCircle stroke="red" fill="#ffff" width={22} height={22} />
          ) : (
            <Mic stroke="black" fill="#ffff" width={22} height={22} />
          )}
          <Text style={styles.recording_button.text}>
            {isRecording ? 'Stop' : 'Start Recording'}
          </Text>
        </Pressable>
        <Pressable onPress={handleTextToSpeech} style={styles.tts_button}>
          <Text style={styles.tts_button.text}>Hear Pronunciation</Text>
        </Pressable>
      </View>
      <>
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionContainer.header}>
            Transcription:
          </Text>
          <Pressable onPress={readResponseFile} style={styles.refresh_button}>
            <Text style={styles.refresh_button.text}>Load all/Reload</Text>
          </Pressable>
          <Pressable
            onPress={clearResponseFile}
            style={styles.clear_response_button}>
            <Text style={styles.clear_response_button.text}>Clear</Text>
          </Pressable>
        </View>
        <Text style={styles.transcriptionContainer.transcription}>
          {transcribedText}
        </Text>
      </>
      <Pressable
        style={styles.highlightMismatchButton}
        onPress={MismatchedWords}>
        <Text style={styles.highlightMismatchButton.text}>
          Mismatched Words
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eae6e6',
  },
  pronunciation_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginTop: 35,
    marginEnd: 10,
    marginStart: 10,
    marginTop: 35,
    marginBottom: 20,
  },
  recording_button: {
    flexDirection: 'row',
    backgroundColor: '#20380a',
    alignSelf: 'center',
    padding: 5,
    text: {
      color: 'white',
      fontSize: 18,
    },
  },
  textInput: {
    height: 250,
    backgroundColor: 'white',
    borderColor: '#000',
    borderWidth: 1,
    margin: 10,
    paddingHorizontal: 8,
    fontSize: 18,
    color: 'black',
  },
  highlightMismatchButton: {
    flexDirection: 'row',
    backgroundColor: '#20380a',
    alignSelf: 'center',
    padding: 5,
    // marginTop: 'auto',
    text: {
      color: 'white',
      fontSize: 18,
    },
  },
  tts_button: {
    flexDirection: 'row',
    backgroundColor: '#20380a',
    alignSelf: 'center',
    padding: 5,
    text: {
      color: 'white',
      fontSize: 18,
      paddingLeft: 5,
      paddingRight: 5,
    },
  },
  refresh_button: {
    backgroundColor: '#20380a',
    text: {
      color: 'white',
      fontSize: 18,
      paddingLeft: 5,
      paddingRight: 5,
    },
  },
  clear_response_button: {
    backgroundColor: '#20380a',
    text: {
      color: 'white',
      fontSize: 18,
      paddingLeft: 5,
      paddingRight: 5,
    },
  },
  transcriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginTop: 35,
    marginEnd: 10,
    marginStart: 10,
    marginTop: 35,
    marginBottom: 20,
    header: {
      color: 'black',
      fontWeight: 'bold',
      textDecorationLine: 'underline',
      fontSize: 18,
      marginRight: 15,
    },
    transcription: {
      fontSize: 18,
      color: 'black',
      height: 250,
    },
    highlightedWord: {
      backgroundColor: 'yellow',
    },
  },
});
