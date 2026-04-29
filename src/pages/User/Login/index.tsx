import Footer from '@/components/Footer';
import loginIllustration from '@/assets/login.png';
import registerIllustration from '@/assets/register.png';
import { LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, SelectLang, useModel } from '@umijs/max';
import Settings from '../../../../config/defaultSettings';
import { Input, Modal, message } from 'antd';
import { generateResetLink } from '@/services/auth';
import React, { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import './index.less';

const LOGIN_BACKGROUND_IMAGE = '';
const LOGIN_ILLUSTRATION =
  'data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IkxheWVyIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjExNDAuNTYiIGhlaWdodD0iNzg3LjI3Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSI4NTIuMzkiIHkxPSI4MzUuODgiIHgyPSI4NTIuMzkiIHkyPSIzMzguMzMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9ImdyYXkiIHN0b3Atb3BhY2l0eT0iLjI1Ii8+PHN0b3Agb2Zmc2V0PSIuNTQiIHN0b3AtY29sb3I9ImdyYXkiIHN0b3Atb3BhY2l0eT0iLjEyIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJncmF5IiBzdG9wLW9wYWNpdHk9Ii4xIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTguNzYgNDE0LjQ2YzIwLjE2LTMyLjkzIDY1Ljc1LTI3LjE5IDk4LjA4LTEwczY0LjU5IDQyLjg1IDEwMC4xNyAzNy45MmMzMC00LjE2IDU0LjYtMzAuMzIgNjcuODktNjAuNXMxNy4xOS02NC4yMSAyMC45My05Ny41NHE3LjA1LTYyLjgxIDE0LjA5LTEyNS43YzEuNzItMTUuMzMgMy43NS0zMS41MSAxMi4zNy00My42NCAxMS4zOS0xNiAzMi4yNy0yMC45MiA1MC4xMy0xNi4xMXMzMy4wOSAxNy43MSA0Ni4xMiAzMi4xYzQxLjc0IDQ2LjA4IDY1LjM5IDEwOC4zNyAxMDEuODggMTU5LjY1IDcuNDMgMTAuNDQgMTUuODIgMjAuNzYgMjYuOTIgMjUuOCAxNiA3LjI1IDM0LjM3IDIuMTIgNTAtNS45NSA1MS0yNi4yOSA4NS4yNi03OS45NCAxMTguOTMtMTMwIDE2LjM4LTI0LjMzIDM2LjM1LTUwLjM1IDYzLjYtNTMgMjguNjctMi44NSA1My41NiAyMS41OCA3MC40MSA0Ny40NSA1NC4wOCA4My4yNCA2NS42NyAxOTYuODggMTMxIDI2OS40OCA4LjExIDkgMTcuMDYgMTcuMzIgMjcuMzcgMjIuOTFhNzAuNjUgNzAuNjUgMCAwIDAgMTAuNiA0LjY1YzU3IDE5LjczIDc2IDk4LjkzIDMzLjg0IDE0NS44OS0uOTEgMS0xLjg0IDItMi43OCAzLTYuMjYgNi42MS0xMy4zNSAxMi44Ni0yMS44MSAxNC44My03Ljg3IDEuODItMTYtLjI4LTIzLjgtMi41NS00OS44Ni0xNC41NS05OS4xMi0zNi43OS0xNTAuNjctMzUuNzEtNTAuMTYgMS05Ny43NCAyNC4xNy0xNDcuMzQgMzIuNTEtMzMuMzUgNS42MS02Ny4yOCA0LjQ5LTEwMSAzLjI4cS0xNjguNDYtNi4wNi0zMzYuODUtMTQuMWMtNTUuNzItMi41Ni0xMTEuNDYtNS0xNjcuMTctNy44NS00Mi45Mi0yLjIzLTcwLjI2LTcuMTQtNzUuMjQtNTYuOTUtNC4zNi00My42Mi00My41Mi05Ny42My0xNy42Ny0xMzkuODdaIiBmaWxsPSIjMjI3MWZmIiBvcGFjaXR5PSIuMSIvPjxlbGxpcHNlIGN4PSI3ODkuOSIgY3k9Ijc0OS41NCIgcng9IjI2OS45OSIgcnk9IjM3LjczIiBmaWxsPSIjMzAzNzRlIi8+PHBhdGggZD0iTTE0OC43NCA1ODYuNzdzMTMuMi0zIDIxLjg1IDUuODdjMCAwLTUuNTYgNS0xOC42NC0uNTRaTTE0Ny4yOCA1ODYuNjRzLTcuODIgMTEuMDgtMi44NiAyMi40NWMwIDAgNi43Ni0zLjI1IDYuNTctMTcuNDVaTTEzOC40OCA1NjkuOTRzNC42OS0xMC4xNSAyNyAyLjEyYzAgMC0yLjQgNi43OC0xMS44OCA2Ljg4cy0xMi4zMi00LjAxLTE1LjEyLTlaTTEzNy4wNiA1NjkuMzJzLTExLjE3LS41Mi0xMC41NCAyNC45MmMwIDAgNy4xMyAxIDExLjU4LTcuMzhzMi4wOS0xMi43MS0xLjA0LTE3LjU0Wk0xMjkuMjggNTQ5LjUyczUtMTcuNjggMjguNDctNi44OGMwIDAtNC4xIDE2LjE5LTI1LjggMTIuNjRaTTEyMC41NyA1MjQuMThzMTAuNTgtMTguMjQgMzIuNDktMy40NGMwIDAtNi4xOSAxNi44Ny0zMC4yOSA5LjU1Wk0xMTYuNDMgNDk5Ljc4czEyLjYzLTE2Ljk1IDM0LjM2LTIuMzFjMCAwLTEyLjA2IDE0Ljk0LTM0LjA5IDYuNFpNMTEyLjY5IDQ3Ni4wNnMxMi43Ni0xNy42NiAzMy41OS0zLjE1YzAgMC0xNC42OCAxNS44My0zMy4zMyA3LjA3Wk0xMTIuNTEgNDU0LjhzMTMuMTUtMjIuNTMgMzIuNjUtOS4xN2MwIDAtMTQuNDIgMTkuNTctMzIuMzcgMTMuMjZaTTExNC4yOCA0MjkuODJzMTQtMjIuNCAzMy4wOS03LjE4YzAgMC0xNy4xIDE5Ljc1LTMyLjg3IDExLjE1Wk0xMTcuOTEgNDA3LjM2czE3LTIxLjMxIDMzLjU1LTE0LjM3YzAgMC0xNy42OCAyMi42LTM0IDE5Ljc2Wk0xMjIuOTEgMzg1Ljk2czE5LjU0LTI2IDMyLjM3LTE4LjYyYzAgMC0xNC4zMSAyMC4wOS0zMy41OCAyMy4zNVpNMTMwLjUzIDM2MS4wMnMxNy4xNy0yMS4zMiAzMS0xNy4yNGMwIDAtMTQuNDUgMjEuODktMzMuMSAyMy42OFpNMTM3LjM4IDMzNy43MXMxOS4xOC0yMC42IDI4LjMxLTE3LjgyYzAgMC0xMy4zNSAyMi4zNi0yOC45MiAyMi4xNVpNMTQ0LjE1IDMxNi4xNXMxNi4wOS0yNC4xNSAyNS44Mi0yM2MwIDAtOS4zMSAyMS4xOS0yNS42NiAyNS4zM1pNMTUxLjE0IDI4Ny4yNHMxNC4zOS0xOC42NiAyMi44MS0xOS4xOGMwIDAtMTAuNzEgMjQuMzQtMjMuMDcgMjVaTTE1NS4xNCAyNjguMDNsMTIuNTgtMzcuNjlzMyAzMy4xLTE0IDQ0LjYyWk0xNTguNTMgMjI3LjE3cy40NC0zMC43OS0xLjMzLTMzLjE3YzAgMCAxMi40NyAyNC43NCAyLjE0IDQ2LjcxWk0xMjguNjQgNTQ5LjE1cy0xNi4yNi04LjYyLTI0Ljc3IDE1LjczYzAgMCAxNC41IDguMjggMjctOS44MVpNMTIwIDUyMy4yM3MtMTkuNzItNy40NS0yNy4zNSAxNy44OGMwIDAgMTUuNDcgOS4xNSAyOS41MS0xMS43NlpNMTE1LjY0IDUwMS4zMXMtMTQuNzktMTUuMTEtMzQuMzYgMi4zM2MwIDAgMTMuOTQgMTMuMTkgMzQuNjMgMS43OVpNMTEyLjIyIDQ3Ni4xcy0xNS0xNS44MS0zMy43MSAxLjM2YzAgMCAxNi42NiAxMy43MyAzNCAyLjU1Wk0xMTIuNTUgNDU1LjRzLTExLjM2LTIzLjQ3LTMxLjgzLTExLjY3YzAgMCAxMi44NiAyMC42MyAzMS4yNCAxNS43NFoiIGZpbGw9IiMyMjcxZmYiLz48cGF0aCBkPSJNMTI5LjI4IDQyOS42NHMtMTEuMzMtMjMuOS0zMi4wNi0xMS4wN2MwIDAgMTQuNjYgMjEuNjEgMzEuMzQgMTQuOTNaTTExOS45OCA0MDcuMzRzLTUuNjQtMjYuNjUtMjMuNTUtMjcuODdjMCAwIDUuNjggMjguMTMgMjEuNTEgMzIuODhaTTEyMy4zNyAzODUuOThzLTMuNjctMzIuMzEtMTguNDYtMzIuNDZjMCAwIDIuMTUgMjQuNTcgMTcuMTEgMzcuMTVaTTEzMiAzNTkuOTlzLTYuMjEtMjYuNjYtMjAuNDctMjljMCAwIDMuNSAyNiAxOS41MyAzNS43MlpNMTM5LjA2IDMzNy43OXMtMi0yOC4wNy0xMC45LTMxLjYyYzAgMC0zLjYxIDI1Ljc4IDguNjUgMzUuMzhaTTE0NC43OSAzMTUuOHMtMy4xNS0yOC44NS0xMi4zMS0zMi4zMmMwIDAtMS41IDIzLjA5IDExLjEgMzQuM1pNMTUyLjU0IDI4OS40NnMtMS42NC0yMy41MS04LjM1LTI4LjYxYzAgMC00LjU4IDI2LjE5IDUuMzUgMzMuNTZaIiBmaWxsPSIjMjI3MWZmIi8+PHBhdGggZD0ibTE1NC4yOCAyNjYuOTItOC44LTM4Ljc0cy02LjIzIDMyLjY0IDkuNTcgNDUuNzhaTTE1Mi45MSAyMjcuOTJzLTE3LjYzLTI1LjI4LTE3LjQ5LTI4LjIyYzAgMCAzLjU0IDI3LjQ4IDI0LjQxIDM5Ljg5Wk0xNTQuMjggMjIwLjAzcy0xNy40Ni0zNi4zOS0yNC40My0zOWMwIDAgMjIuMDkgOS40MyAyNS42MSAzNy44WiIgZmlsbD0iIzIyNzFmZiIvPjxwYXRoIGQ9Im0xNTAuODIgMjkzLjI1LTEtLjI1YzkuODUtNDIgMTEuMjQtNjguNDggMy45LTc0LjU2bC42OC0uODJjNy43NCA2LjQ0IDYuNTIgMzIuNi0zLjU4IDc1LjYzWiIgZmlsbD0iIzQ0NDA1MyIvPjxwYXRoIGQ9Im0xMjIuNTQgMzkxLjkxLTEuNTUtLjQzYzEuMDktMy44NiAyLjI3LTcuNzkgMy41My0xMS42NiAxMS0zMy43MiAyMC4xNC02NSAyNS43NS04OC45NGwxLjI3LS43NWMtNS42MiAyNC0xNC41MSA1Ni40My0yNS40OSA5MC4xOC0xLjI1IDMuODYtMi40MyA3Ljc2LTMuNTEgMTEuNloiIGZpbGw9IiM0NDQwNTMiLz48cGF0aCBkPSJNMTY5LjU5IDYxNi4zMWMtLjIyLS4yMS0yMi4yMi0yMS44Ny0zOS4xMi02MC4yNGEyMzIuMzcgMjMyLjM3IDAgMCAxLTE4LjYxLTcwLjc3Yy0zLTMwLjUzIDEuMS02NS4xMyAxMC05Ni45bDEuMjggMS4zMmMtMjAgNzEuMzEtNi4xOSAxMzAuMzQgOS4yMyAxNjUuNCAxNi43MyAzOCAzOC40OCA1OS40NSAzOC43IDU5LjY2WiIgZmlsbD0iIzQ0NDA1MyIvPjxwYXRoIGQ9Ik0xOTMuODEgNTAyLjFzOC0xLjgzIDEzLjIyIDMuNTVjMCAwLTMuMzcgMy0xMS4yNy0uMzNaTTE5Mi45NCA1MDIuMDNzLTQuNzIgNi43LTEuNzIgMTMuNTdjMCAwIDQuMDgtMiA0LTEwLjU1Wk0xODcuNjIgNDkxLjkyczIuODMtNi4xMyAxNi4zIDEuMjljMCAwLTEuNDUgNC4wOS03LjE4IDQuMTVzLTcuNDEtMi40Mi05LjEyLTUuNDRaTTE4Ni43NiA0OTEuNTVzLTYuNzYtLjMxLTYuMzggMTUuMDZjMCAwIDQuMzEuNiA3LTQuNDZzMS4yNy03LjY4LS42Mi0xMC42Wk0xODIuMDMgNDc5LjU4czMuMDctMTAuNjkgMTcuMjMtNC4xOGMwIDAtMi40NyA5Ljc5LTE1LjU5IDcuNjRaTTE3Ni43OSA0NjQuMjZzNi4zOS0xMSAxOS42NC0yLjA4YzAgMC0zLjc1IDEwLjItMTguMzEgNS43N1pNMTc0LjI4IDQ0OS41MXM3LjY0LTEwLjI1IDIwLjc3LTEuNGMwIDAtNy4yOCA5LTIwLjYgMy44N1pNMTcyLjAyIDQzNS4xN3M3LjcyLTEwLjY4IDIwLjMxLTEuOWMwIDAtOC44NyA5LjU3LTIwLjE1IDQuMjdaTTE3MS45MiA0MjIuMzFzOC0xMy42MSAxOS43My01LjU0YzAgMC04LjcyIDExLjgzLTE5LjU3IDhaTTE3Mi45NiA0MDcuMjJzOC40OS0xMy41NSAyMC00LjM4YzAgMC0xMC4zNCAxMS45NC0xOS44OCA2Ljc0Wk0xNzUuMTggMzkzLjY0czEwLjI3LTEyLjg4IDIwLjI4LTguNjhjMCAwLTEwLjY5IDEzLjY2LTIwLjUzIDExLjk0Wk0xNzguMiAzODAuN3MxMS44MS0xNS43MSAxOS41Ny0xMS4yNmMwIDAtOC42NSAxMi4xNS0yMC4zIDE0LjEyWk0xODIuODEgMzY1LjY0czEwLjM4LTEyLjg5IDE4Ljc2LTEwLjQyYzAgMC04LjczIDEzLjIzLTIwIDE0LjMxWk0xODYuOTUgMzUxLjUzczExLjU5LTEyLjQ1IDE3LjExLTEwLjc3YzAgMC04LjA2IDEzLjUxLTE3LjQ4IDEzLjM5Wk0xOTEuMDQgMzM4LjVzOS43My0xNC42IDE1LjYxLTEzLjkyYzAgMC01LjYyIDEyLjgxLTE1LjUxIDE1LjMyWk0xOTUuMjggMzIxLjAyczguNy0xMS4yOCAxMy43OS0xMS42YzAgMC02LjQ4IDE0LjcyLTEzLjk1IDE1LjA5Wk0xOTcuNjkgMzA5LjRsNy41OS0yMi43NnMxLjggMjAtOC40OSAyN1pNMTk5Ljc0IDI4NC43cy4yNi0xOC42MS0uODEtMjAuMDVjMCAwIDcuNTQgMTQuOTUgMS4yOSAyOC4yNFpNMTgxLjY2IDQ3OS4zNnMtOS44Mi01LjIyLTE1IDkuNWMwIDAgOC43NyA1IDE2LjMzLTUuOTJaTTE3Ni40NSA0NjMuNjRzLTExLjkzLTQuNS0xNi41NCAxMC44MWMwIDAgOS4zNSA1LjUzIDE3Ljg0LTcuMVpNMTczLjggNDUwLjQzcy04LjkzLTkuMTMtMjAuNzcgMS40YzAgMCA4LjQzIDggMjAuOTQgMS4wOFpNMTcxLjc0IDQzNS4xOXMtOS4wNy05LjU1LTIwLjM4LjgzYzAgMCAxMC4wNyA4LjI5IDIwLjU0IDEuNTRaTTE3MS45NCA0MjIuNjRzLTYuODctMTQuMTktMTkuMjUtNy4wNmMwIDAgNy43OCAxMi40NyAxOC44OSA5LjUyWiIgZmlsbD0iIzIyNzFmZiIvPjxwYXRoIGQ9Ik0xNzMuNjkgNDA3LjA5cy02Ljg1LTE0LjQ1LTE5LjQxLTYuNjljMCAwIDguODYgMTMuMDcgMTguOTUgOVpNMTc2LjQzIDM5My42NHMtMy40MS0xNi4xMi0xNC4yNC0xNi44NWMwIDAgMy40MyAxNyAxMyAxOS44N1pNMTc4LjQ4IDM4MC43MXMtMi4yLTE5LjUzLTExLjItMTkuNjNjMCAwIDEuMyAxNC44NiAxMC4zNCAyMi40N1pNMTgzLjY5IDM2NXMtMy43NS0xNi4xMi0xMi4zNy0xNy41NGMwIDAgMi4xMiAxNS43MSAxMS44MSAyMS41OVpNMTg3Ljk2IDM1MS41OHMtMS4yMy0xNy02LjU4LTE5LjEyYzAgMC0yLjE5IDE1LjU5IDUuMjIgMjEuMzlaTTE5MS40MyAzMzguMjhzLTEuOS0xNy40NC03LjQ0LTE5LjU0YzAgMC0uOTEgMTQgNi43MSAyMC43NFpNMTk2LjExIDMyMi4zNnMtMS0xNC4yMS01LTE3LjNjMCAwLTIuNzcgMTUuODQgMy4yMyAyMC4yOVoiIGZpbGw9IiMyMjcxZmYiLz48cGF0aCBkPSJtMTk3LjE5IDMwOC43My01LjMyLTIzLjQycy0zLjc3IDE5Ljc0IDUuNzggMjcuNjhaTTE5Ni4zNCAyODUuMTZzLTEwLjY1LTE1LjI3LTEwLjU3LTE3LjA2YzAgMCAyLjEzIDE2LjYxIDE0Ljc1IDI0LjExWk0xOTcuMTQgMjgwLjM4cy0xMC41Ni0yMi0xNC43Ny0yMy41NWMwIDAgMTMuMzYgNS43IDE1LjQ4IDIyLjg2WiIgZmlsbD0iIzIyNzFmZiIvPjxwYXRoIGQ9Im0xOTUuMDcgMzI0LjY0LS42My0uMTVjNi0yNS4zOSA2LjgtNDEuNCAyLjM2LTQ1LjA3bC40MS0uNWM0LjcxIDMuOSAzLjk3IDE5LjcyLTIuMTQgNDUuNzJaIiBmaWxsPSIjNDQ0MDUzIi8+PHBhdGggZD0ibTE3Ny45OCAzODQuMy0uOTQtLjI3Yy42Ni0yLjMzIDEuMzgtNC43IDIuMTQtNyA2LjYzLTIwLjM5IDEyLjE3LTM5LjMgMTUuNTYtNTMuNzdsLjc3LS40NmMtMy40IDE0LjUtOC43NyAzNC4xMi0xNS40MSA1NC41My0uNzYgMi4zMS0xLjQ3IDQuNjQtMi4xMiA2Ljk3WiIgZmlsbD0iIzQ0NDA1MyIvPjxwYXRoIGQ9Ik0yMDYuNDIgNTE5Ljk2Yy0uMTMtLjEzLTEzLjQzLTEzLjIyLTIzLjY1LTM2LjQyYTE0MC43MiAxNDAuNzIgMCAwIDEtMTEuMjUtNDIuNzhjLTEuODMtMTguNDYuNjctMzkuMzggNi4wNi01OC41OWwuNzcuOGMtMTIuMDkgNDMuMTEtMy43NCA3OC44IDUuNTggMTAwIDEwLjEyIDIzIDIzLjI2IDM1LjkzIDIzLjQgMzYuMDZaIiBmaWxsPSIjNDQ0MDUzIi8+PHBhdGggZD0iTTIzNi41IDU2OS45NmEzOC4yNCAzOC4yNCAwIDAgMC03LjUgMi4xNGMtNTMuOTQgMjEuNTQtNTMuMDQgMTYyLjU0LTUzLjA0IDE2Mi41NGgtMTUuODhzLTUtNjAuNTEtMjYuNzktMTQ2Ljg0Yy0xOS42My03Ny42NyA2MC44OC0xNDcuMjggNzcuMjMtMTYwLjQ4IDEuODQtMS40NyAyLjg2LTIuMjUgMi44Ni0yLjI1IDgxLjA5IDI5LjggMjMuMTIgMTQ0Ljg5IDIzLjEyIDE0NC44OVoiIGZpbGw9IiNhZmMwZTAiLz48cGF0aCBkPSJNMjE5LjI4IDQyNy41MmMtMS44Ny0uODYtMy44LTEuNjgtNS44NS0yLjQzIDAgMC0xIC43OC0yLjg2IDIuMjUtMTYuMzUgMTMuMi05Ni44NiA4Mi44MS03Ny4yMyAxNjAuNDggMjEuNzkgODYuMzMgMjYuNzQgMTQ2LjgyIDI2Ljc0IDE0Ni44Mmg4Ljkzcy00Ljk1LTYwLjUxLTI2Ljc5LTE0Ni44NGMtMTkuNTUtNzcuMzEgNjAuMTgtMTQ2LjY2IDc3LjA2LTE2MC4yOFoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTUwNC4wNCA1ODcuODJjLTIxLjg0IDg2LjMzLTI2Ljc2IDE0Ni44Mi0yNi43NiAxNDYuODJoLTE1LjkxczEtMTQ3LjM2LTU2LjczLTE2My44MWEzMS41MyAzMS41MyAwIDAgMC0zLjgxLS44OXMtNTgtMTE1LjA5IDIzLjEyLTE0NC44N2MwIDAgLjgyLjYxIDIuMyAxLjggMTUuMDMgMTIuMDMgOTcuNjQgODIuMzggNzcuNzkgMTYwLjk1WiIgZmlsbD0iI2FmYzBlMCIvPjxwYXRoIGQ9Ik0yMzYuNSA1NjkuOTZhMzguMjQgMzguMjQgMCAwIDAtNy41IDIuMTQgOTc5LjIxIDk3OS4yMSAwIDAgMS0xOC40OC0xNDQuNzZjMS44NC0xLjQ3IDIuODYtMi4yNSAyLjg2LTIuMjUgODEuMDkgMjkuNzggMjMuMTIgMTQ0Ljg3IDIzLjEyIDE0NC44N1pNNDI2LjI4IDQyNi44OWE5MDEgOTAxIDAgMCAxLTIxLjYxIDE0NCAzMS41MyAzMS41MyAwIDAgMC0zLjgxLS44OXMtNTgtMTE1LjA5IDIzLjEyLTE0NC44N2MtLjAzLS4wNC43OS41NyAyLjMgMS43NloiIG9wYWNpdHk9Ii4xIi8+PHBhdGggZD0iTTM5Ni41OSA1OTEuNzhxLTguNCAzMy4xNC0xOS42OSA2OHMtMzUuNzIgMzcuMjEtMTIyIDBjMCAwLTguNjItMjQuMy0xOC4xLTY1LjYxLTIwLjg3LTkwLjgzLTQ1LjktMjYzLjkyIDcuNDMtNDQxLjcxQTY2MS43NSA2NjEuNzUgMCAwIDEgMzExLjQxIDBzNDUuNTYgNTIuMzEgNzkgMTUyLjQzIDU0LjcyIDI0OC4wNyA2LjE4IDQzOS4zNVoiIGZpbGw9IiNlM2U4ZjQiLz48Y2lyY2xlIGN4PSIzMTguNjYiIGN5PSIyOTMuNiIgcj0iNzEuNjMiIGZpbGw9IiNhZmMwZTAiLz48cGF0aCBkPSJNMzY5LjQ2IDI5My42NGE1MC44IDUwLjggMCAwIDEtODMgMzkuMjkgNTEuMzMgNTEuMzMgMCAwIDEtOS41Mi0xMC4zMyA1MCA1MCAwIDAgMS0zLjI4LTUuMzkgNTAuNyA1MC43IDAgMCAxLTUuNzktMjMuNTd2LTEuMjFhNTAuODYgNTAuODYgMCAwIDEgMzctNDcuNzIgNTIuNTMgNTIuNTMgMCAwIDEgMTIuMjQtMS44NmgxLjUyYTUwLjggNTAuOCAwIDAgMSA1MC44MyA1MC43OVoiIGZpbGw9IiMyMjcxZmYiLz48cGF0aCBkPSJNMzkwLjQgMTUyLjQzYy04MS4yNyAzOC45MS0xNDYuMjIgMC0xNDYuMjIgMEE2NjEuNzUgNjYxLjc1IDAgMCAxIDMxMS40MSAwczQ1LjU2IDUyLjMxIDc4Ljk5IDE1Mi40M1pNMzk2LjU5IDU5MS43OHEtNS43IDIyLjQ0LTEyLjcgNDUuNjUtMy4zMiAxMS4wNy03IDIyLjMycy0zNS43MiAzNy4yMS0xMjIgMGMwIDAtMi44LTcuODktNy0yMi4zMi0zLjE0LTEwLjktNy4wNS0yNS41MS0xMS4xMy00My4yOSAwIDAgMzIuMTIgMTMuNzEgNzcuNzEgMTMuNzFhMjE0LjExIDIxNC4xMSAwIDAgMCA4Mi4xMi0xNi4wN1oiIGZpbGw9IiNhZmMwZTAiLz48cGF0aCBkPSJNMzgzLjg5IDYzNy40M3EtMy4zMiAxMS4wNy03IDIyLjMycy0zNS43MiAzNy4yMS0xMjIgMGMwIDAtMi44LTcuODktNy0yMi4zMi0uMDEgMCA4Ny45MyAyNS4zIDEzNiAwWiIgZmlsbD0iI2UzZThmNCIvPjxwYXRoIGQ9Im0zMDQuOSAyNDQuNjQtLjExLjA4LTM2LjkgNDcuNjR2MS4yMWE1MC43IDUwLjcgMCAwIDAgNS43OSAyMy41N2w0My40OC03NC4zNlpNMzE2LjY4IDI4Ny42NGwtMzAuMjIgNDUuMjVhNTEuMzMgNTEuMzMgMCAwIDEtOS41Mi0xMC4zM2wzNi0zOC42NFoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTI3NC4yIDY1OS43NnMtOC42Mi0yNC4zMS0xOC4xLTY1LjYxYy0yMC44Ny05MC44NC00NS45LTI2My45MyA3LjQzLTQ0MS43MmE2NjQuMTggNjY0LjE4IDAgMCAxIDU4Ljg1LTEzOC4wOWMtNi43Ny05LjQ5LTExLTE0LjMzLTExLTE0LjMzYTY2MS42OCA2NjEuNjggMCAwIDAtNjcuMiAxNTIuNDJjLTUzLjMzIDE3Ny43OS0yOC4zIDM1MC44OC03LjQzIDQ0MS43MiA5LjQ4IDQxLjMgMTguMSA2NS42MSAxOC4xIDY1LjYxIDM0LjA5IDE0LjY5IDYwLjI4IDE3Ljc3IDc5LjUgMTYuMTMtMTYuNDItMS4yNS0zNi4zNi01Ljg4LTYwLjE1LTE2LjEzWiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjIiLz48cGF0aCBkPSJNOTM2Ljk4IDcyOC45M3M0Ni43NC01OC4xNiA0My42NC0xMTYuNDFhMTEzLjA1IDExMy4wNSAwIDAgMSAxOC41NC02OS4wNiAxOTAuMTkgMTkwLjE5IDAgMCAxIDIyLTI3IiBmaWxsPSJub25lIiBzdHJva2U9IiM1MzU0NjEiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEwMTkuMzkgNDc5Ljc4Yy0zLjM0IDguMTEgMS42NiAzNy42OCAxLjY2IDM3LjY4czI0LjM3LTE3LjQ4IDI3LjcxLTI1LjU5YTE1Ljg4IDE1Ljg4IDAgMCAwLTI5LjM3LTEyLjA5Wk05NzYuNjEgNTE0LjcyYzEuNjEgOC42MiAyMS44OCAzMC43MiAyMS44OCAzMC43MnMxMS0yNy45MSA5LjM1LTM2LjU0YTE1Ljg4NCAxNS44ODQgMCAwIDAtMzEuMjMgNS44MlpNOTQ2LjA3IDU5MS45NGM1Ljc0IDYuNjMgMzQuNCAxNS40OCAzNC40IDE1LjQ4cy00LjY0LTI5LjYzLTEwLjM4LTM2LjI3YTE1Ljg4IDE1Ljg4IDAgMCAwLTI0IDIwLjc5Wk05MzYuMTIgNjU1LjU3YzQuNTMgNy41MSAzMS4yOCAyMS4wNyAzMS4yOCAyMS4wN3MuNDQtMzAtNC4wOS0zNy41YTE1Ljg4NCAxNS44ODQgMCAxIDAtMjcuMTkgMTYuNDNaTTEwMjguNjggNTU5LjcxYy04LjE0IDMuMjUtMzcuNjYtMi4wNS0zNy42Ni0yLjA1czE3LjcyLTI0LjE5IDI1Ljg3LTI3LjQ1YTE1Ljg4NCAxNS44ODQgMCAwIDEgMTEuNzkgMjkuNVpNMTAxNi4xIDYzMy45OGMtOC43NC42Ny0zNS4zMi0xMy4yMi0zNS4zMi0xMy4yMnMyNC4xNC0xNy43OSAzMi44OS0xOC40NmExNS44OSAxNS44OSAwIDAgMSAyLjQzIDMxLjY4Wk05OTMuOTcgNzA0LjQ4Yy04LjUxIDIuMTQtMzcuMDUtNy4wNi0zNy4wNS03LjA2czIwLjc5LTIxLjYxIDI5LjMtMjMuNzRhMTUuODggMTUuODggMCAxIDEgNy43NSAzMC44WiIgZmlsbD0iIzIyNzFmZiIvPjxwYXRoIGQ9Ik05MzcuNCA3MjYuNXM2Ni4zLTM0LjI0IDg3LjA3LTg4Ljc0YTExMyAxMTMgMCAwIDEgNDQuOTQtNTUuNjMgMTg5LjkxIDE4OS45MSAwIDAgMSAzMS0xNS43NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTM1NDYxIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xMTEzLjcgNTMyLjFjLTYuMzQgNi4wNy0xMy43NSAzNS4xMy0xMy43NSAzNS4xM3MyOS4zNi02LjExIDM1LjctMTIuMTdhMTUuODk3IDE1Ljg5NyAwIDAgMC0yMS45NS0yM1pNMTA2MC40NCA1NDYuNzFjLTIgOC41NCA3LjU1IDM3IDcuNTUgMzdzMjEuMjktMjEuMDcgMjMuMzUtMjkuNjZhMTUuODggMTUuODggMCAwIDAtMzAuOS03LjM0Wk0xMDAxLjIyIDYwNC45M2MyLjU2IDguMzkgMjUuMTggMjguMDkgMjUuMTggMjguMDlzNy43Ny0yOSA1LjIxLTM3LjM1YTE1Ljg4NSAxNS44ODUgMCAwIDAtMzAuMzkgOS4yNlpNOTY2LjM0IDY1OS4wN2MxLjEgOC43MSAyMC4wNiAzMS45NCAyMC4wNiAzMS45NHMxMi41Ni0yNy4yMyAxMS40NS0zNS45NGExNS44ODEgMTUuODgxIDAgMCAwLTMxLjUxIDRaTTEwODkuODEgNjA4Ljk0Yy04Ljc3LS4zMi0zMy42LTE3LjEzLTMzLjYtMTcuMTNzMjYtMTQuOTMgMzQuNzctMTQuNjFhMTUuODggMTUuODggMCAxIDEtMS4xNyAzMS43NFpNMTA0OC4yMSA2NzEuNzRjLTguMjctMi45My0yNi45NC0yNi40LTI2Ljk0LTI2LjRzMjkuMjktNi40NyAzNy41NS0zLjU0YTE1Ljg4MiAxNS44ODIgMCAxIDEtMTAuNjEgMjkuOTRaTTk5OS40IDcyNy4yM2MtOC42NC0xLjQ5LTMxLTIxLjQ3LTMxLTIxLjQ3czI3Ljc3LTExLjMyIDM2LjQxLTkuODNhMTUuODgxIDE1Ljg4MSAwIDEgMS01LjQgMzEuM1oiIGZpbGw9IiMyMjcxZmYiLz48cGF0aCBkPSJNODczLjQzIDc0Ni40NWMuNSAxMiA5Ljg1IDI2Ljg5IDE1LjQyIDM0Ljc2IDMuNTItLjA5IDYuMjUtLjI0IDYuMjUtLjI0cy0yLjE4LTU4LTMuODItNjRjLS43OC0yLjkyLTQuNjMtMi4yOC04LjQzLS44Mi00LjU3IDguNi05LjgyIDIwLjYzLTkuNDIgMzAuM1oiIG9wYWNpdHk9Ii4xIi8+PC9zdmc+';

const Lang = () => (
  <div className="argux-auth-lang" data-lang>
    {SelectLang && <SelectLang />}
  </div>
);

const Login: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const [shellPhase, setShellPhase] = useState<'idle' | 'leave' | 'enter'>('idle');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { loginPity, registerPity } = useModel('auth');

  const pageStyle = useMemo(
    () => ({
      backgroundImage: LOGIN_BACKGROUND_IMAGE.trim()
        ? `linear-gradient(135deg, rgba(31, 41, 70, 0.26), rgba(123, 92, 210, 0.16)), url(${LOGIN_BACKGROUND_IMAGE})`
        : 'radial-gradient(circle at 18% 20%, rgba(255, 177, 164, 0.36), transparent 24%), radial-gradient(circle at 82% 18%, rgba(167, 179, 255, 0.32), transparent 26%), linear-gradient(135deg, #f4f1ff 0%, #f8efff 48%, #fff5f0 100%)',
    }),
    [],
  );

  const currentIllustration = type === 'register' ? registerIllustration : loginIllustration;

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    let resp;
    if (type === 'register') {
      resp = await registerPity({
        name: values?.name,
        password: values.password,
        email: values?.email,
        username: values.username,
      });
    } else {
      resp = await loginPity({ username: values.username, password: values.password });
    }
    if (resp.code === 0) {
      message.success(type === 'register' ? '注册成功，已自动登录' : '登录成功');
      await fetchUserInfo();
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
      return;
    }
    message.error(resp.msg);
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim();
    if (!email) {
      message.warning('请输入邮箱');
      return;
    }
    setForgotSubmitting(true);
    try {
      await generateResetLink(email);
      message.success('重置链接已发送，请检查邮箱');
      setForgotOpen(false);
      setForgotEmail('');
    } catch (error) {
      message.error('发送重置链接失败');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const triggerTypeChange = (nextType: string) => {
    if (nextType === type || shellPhase !== 'idle') {
      return;
    }
    setShellPhase('leave');
    window.setTimeout(() => {
      setType(nextType);
      setShellPhase('enter');
      window.setTimeout(() => {
        setShellPhase('idle');
      }, 360);
    }, 260);
  };

  return (
    <div className="argux-auth-page" style={pageStyle}>
      <Helmet>
        <title>{Settings.title}</title>
      </Helmet>
      <Lang />
      <div className={`argux-auth-shell ${shellPhase === 'leave' ? 'is-leaving' : ''} ${shellPhase === 'enter' ? 'is-entering' : ''}`}>
        <div className="argux-auth-visual">
          <div className="argux-auth-visual-glow" />
          <img
            src={currentIllustration}
            alt={type === 'register' ? 'register visual' : 'login visual'}
            className={`argux-auth-illustration ${type === 'register' ? 'register' : 'login'}`}
          />
        </div>
        <div className="argux-auth-content">
          <h1 className="argux-auth-title">hello !</h1>
          <div key={type} className="argux-auth-stage">
            <p className="argux-auth-subtitle">
              {type === 'register' ? '欢迎注册 Argux 测试工作台' : '欢迎回到 Argux 测试工作台'}
            </p>
            <div className="argux-auth-form-wrap">
              <div className="argux-auth-form">
              <LoginForm
                submitter={false}
                initialValues={{ autoLogin: true }}
                onFinish={async (values) => {
                  await handleSubmit(values as API.LoginParams);
                }}
              >
                {type === 'account' && (
                  <>
                    <ProFormText
                      name="username"
                      fieldProps={{
                        size: 'large',
                        prefix: <UserOutlined />,
                      }}
                      placeholder="请输入用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    />
                    <ProFormText.Password
                      name="password"
                      fieldProps={{
                        size: 'large',
                        prefix: <LockOutlined />,
                      }}
                      placeholder="请输入密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    />
                  </>
                )}

                {type === 'register' && (
                  <>
                    <ProFormText
                      name="username"
                      fieldProps={{
                        size: 'large',
                        prefix: <UserOutlined />,
                      }}
                      placeholder="请输入用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    />
                    <ProFormText
                      name="name"
                      fieldProps={{
                        size: 'large',
                        prefix: <MobileOutlined />,
                      }}
                      placeholder="请输入姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    />
                    <ProFormText
                      name="email"
                      fieldProps={{
                        size: 'large',
                        prefix: <MailOutlined />,
                      }}
                      placeholder="请输入用户邮箱"
                      rules={[{ type: 'email', required: true, message: '请输入合法的邮箱' }]}
                    />
                    <ProFormText.Password
                      name="password"
                      fieldProps={{
                        size: 'large',
                        prefix: <LockOutlined />,
                      }}
                      placeholder="请输入用户密码"
                      rules={[{ required: true, message: '请输入用户密码' }]}
                    />
                  </>
                )}

                <div className="argux-auth-meta">
                  {type === 'register' ? (
                    <>
                      <span className="argux-auth-hint">创建账号后即可进入测试工作台</span>
                      <button
                        type="button"
                        className="argux-auth-switch-link"
                        onClick={() => triggerTypeChange('account')}
                      >
                        返回登录
                      </button>
                    </>
                  ) : (
                    <>
                      <ProFormCheckbox noStyle name="autoLogin">
                        自动登录
                      </ProFormCheckbox>
                      <span className="argux-auth-hint">继续进入你的项目和用例协作空间</span>
                    </>
                  )}
                </div>

                <button type="submit" className="ant-btn ant-btn-primary ant-btn-lg ant-btn-block">
                  <span>{type === 'register' ? '注 册' : '登 录'}</span>
                </button>

                {type === 'account' ? (
                  <div className="argux-auth-actions">
                    <button
                      type="button"
                      className="argux-auth-action-button"
                      onClick={() => triggerTypeChange('register')}
                    >
                      注册
                    </button>
                    <button
                      type="button"
                      className="argux-auth-switch-link"
                      onClick={() => setForgotOpen(true)}
                    >
                      忘记密码
                    </button>
                  </div>
                ) : null}
              </LoginForm>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        title="忘记密码"
        open={forgotOpen}
        okText="发送重置链接"
        cancelText="取消"
        confirmLoading={forgotSubmitting}
        onOk={handleForgotPassword}
        onCancel={() => {
          if (forgotSubmitting) return;
          setForgotOpen(false);
        }}
      >
        <Input
          value={forgotEmail}
          placeholder="请输入注册邮箱"
          prefix={<MailOutlined />}
          onChange={(event) => setForgotEmail(event.target.value)}
          onPressEnter={handleForgotPassword}
        />
      </Modal>
      <Footer />
    </div>
  );
};

export default Login;
