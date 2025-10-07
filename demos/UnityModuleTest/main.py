# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# conda env create -f environment.yaml
# conda activate xrpa-unity-module-test
# python main.py

import random
import sys

from psychopy import visual
from PyQt5.QtCore import QTimer
from PyQt5.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from xrpa.sensory_stimulus_types import Pose, Quaternion, Vector3
from xrpa.unity_module_test_application_interface import (
    UnityModuleTestApplicationInterface,
)


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        self._interface = UnityModuleTestApplicationInterface()

        self.initUI()

        self._win = visual.Window(size=(640, 480), color=[-1, -1, -1])
        self._circle_stim = visual.Circle(
            self._win, radius=0.2, pos=[-0.5, 0], lineColor=[1, 0, 0], fillColor=None
        )
        self._rect_stim = visual.Rect(
            self._win,
            width=0.4,
            height=0.2,
            pos=[0.5, 0],
            lineColor=[0, 1, 0],
            fillColor=None,
        )

        self._outbound_window = (
            self._interface.sensory_stimulus_data_store.PsychoPyWindow.create_object()
        )
        self._outbound_window.set_display_source(self._win)

        self._showing_circle = True

        self._timer = QTimer(self)
        self._timer.timeout.connect(self.psychopy_flip)
        self._timer.start(100)

    def initUI(self):
        self.setGeometry(100, 100, 300, 150)
        self.setWindowTitle("Python/Unity Test")

        layout = QVBoxLayout()
        self.setLayout(layout)

        audio_delay_layout = QHBoxLayout()
        audio_delay_label = QLabel("Audio Delay (s):")
        self.audio_delay_input = QLineEdit("0.0")
        audio_delay_layout.addWidget(audio_delay_label)
        audio_delay_layout.addWidget(self.audio_delay_input)
        layout.addLayout(audio_delay_layout)

        visual_delay_layout = QHBoxLayout()
        visual_delay_label = QLabel("Visual Delay (s):")
        self.visual_delay_input = QLineEdit("0.0")
        visual_delay_layout.addWidget(visual_delay_label)
        visual_delay_layout.addWidget(self.visual_delay_input)
        layout.addLayout(visual_delay_layout)

        run_button = QPushButton("Run")
        run_button.clicked.connect(self.run_stimulus)
        layout.addWidget(run_button)

    def closeEvent(self, event):
        self._timer.stop()
        self._interface.shutdown()
        event.accept()

    def run_stimulus(self):
        stimulus = None

        def handle_stimulus_response(timestamp: int):
            nonlocal stimulus
            self._interface.sensory_stimulus_data_store.Stimulus.remove_object(
                stimulus.get_xrpa_id()
            )
            print("Received stimulus response")

        def create_stimulus():
            nonlocal stimulus
            stimulus = (
                self._interface.sensory_stimulus_data_store.Stimulus.create_object()
            )
            try:
                stimulus.set_audio_delay(float(self.audio_delay_input.text()))
                stimulus.set_visual_delay(float(self.visual_delay_input.text()))
            except ValueError:
                print("Invalid input. Please enter a valid number.")
                return

            # randomize position from -1 to 1
            position = Vector3(
                2 * (0.5 - random.random()),
                2 * (0.5 - random.random()),
                2 * (0.5 - random.random()),
            )
            stimulus.set_pose(Pose(position, Quaternion(0, 0, 0, 1)))
            stimulus.on_user_response(handle_stimulus_response)

        self._interface.transact(create_stimulus)

    def psychopy_flip(self):
        if self._showing_circle:
            self._circle_stim.draw()
        else:
            self._rect_stim.draw()
        self._win.flip()
        self._showing_circle = not self._showing_circle


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
