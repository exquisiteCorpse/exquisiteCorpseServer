import React, { Component } from 'react'
import { View, Button } from 'react-native'

export default class CameraNavButton extends Component {
  render () {
    return (
      <View>
        <Button
          onPress={() => this.props.navigate('Camera')}
          title="Camera"
        />
      </View>
    )
  }
}
