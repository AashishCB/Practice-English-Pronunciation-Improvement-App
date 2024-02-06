import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import RNFS from 'react-native-fs';
import {useFocusEffect} from '@react-navigation/native';

export function TranscriptionScreen() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const responseFilePath = RNFS.ExternalDirectoryPath + '/responses.txt';

  const readResponseFile = useCallback(async () => {
    try {
      setLoading(true);
      const fileContent = await RNFS.readFile(responseFilePath, 'utf8');
      setContent(fileContent);
    } catch (error) {
      console.log('Please Record Something First');
    } finally {
      setLoading(false);
    }
  }, [responseFilePath]);

  useEffect(() => {
    readResponseFile().then(() => console.log('File Read Complete'));
  }, [readResponseFile]);

  useFocusEffect(
    React.useCallback(() => {
      readResponseFile().then(() => console.log('Updated File contents'));
    }, [readResponseFile]),
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.blackText}>{content}</Text>
          <View style={styles.buttonContainer}>
            <Pressable onPress={readResponseFile} style={styles.refresh_button}>
              <Text style={styles.refresh_button.text}>Refresh</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eae6e6',
  },
  blackText: {
    color: 'black',
    fontSize: 18,
    margin: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  refresh_button: {
    backgroundColor: '#20380a',
    text: {
      color: 'white',
      fontSize: 18,
      padding: 5,
    },
  },
});
