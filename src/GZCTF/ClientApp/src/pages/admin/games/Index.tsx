import dayjs from 'dayjs'
import { FC, useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Paper,
  Text,
  Table,
  Badge,
  ScrollArea,
  Switch,
  Code,
} from '@mantine/core'
import {
  mdiArrowLeftBold,
  mdiArrowRightBold,
  mdiChevronTripleRight,
  mdiPencilOutline,
  mdiPlus,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import { GameColorMap, getGameStatus } from '@Components/GameCard'
import AdminPage from '@Components/admin/AdminPage'
import GameCreateModal from '@Components/admin/GameCreateModal'
import { showErrorNotification } from '@Utils/ApiErrorHandler'
import { useTableStyles } from '@Utils/ThemeOverride'
import { useArrayResponse } from '@Utils/useArrayResponse'
import api, { GameInfoModel } from '@Api'

const ITEM_COUNT_PER_PAGE = 30

const Games: FC = () => {
  const [page, setPage] = useState(1)
  const [createOpened, setCreateOpened] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const {
    data: games,
    total,
    setData: setGames,
    updateData: updateGames,
  } = useArrayResponse<GameInfoModel>()
  const [current, setCurrent] = useState(0)

  const navigate = useNavigate()
  const { classes } = useTableStyles()

  const onToggleHidden = (game: GameInfoModel) => {
    if (game.id) {
      setDisabled(true)
      api.edit
        .editUpdateGame(game.id, {
          ...game,
          hidden: !game.hidden,
        })
        .then(() => {
          games &&
            updateGames(games.map((g) => (g.id === game.id ? { ...g, hidden: !g.hidden } : g)))
        })
        .catch(showErrorNotification)
        .finally(() => setDisabled(false))
    }
  }

  useEffect(() => {
    api.edit
      .editGetGames({
        count: ITEM_COUNT_PER_PAGE,
        skip: (page - 1) * ITEM_COUNT_PER_PAGE,
      })
      .then((res) => {
        setGames(res.data)
        setCurrent((page - 1) * ITEM_COUNT_PER_PAGE + res.data.length)
      })
  }, [page])

  return (
    <AdminPage
      isLoading={!games}
      headProps={{ position: 'apart' }}
      head={
        <>
          <Button leftIcon={<Icon path={mdiPlus} size={1} />} onClick={() => setCreateOpened(true)}>
            新建比赛
          </Button>
          <Group w="calc(100% - 9rem)" position="right">
            <Text weight="bold" size="sm">
              已显示 <Code>{current}</Code> / <Code>{total}</Code> 比赛
            </Text>
            <ActionIcon size="lg" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <Icon path={mdiArrowLeftBold} size={1} />
            </ActionIcon>
            <ActionIcon
              size="lg"
              disabled={games && games.length < ITEM_COUNT_PER_PAGE}
              onClick={() => setPage(page + 1)}
            >
              <Icon path={mdiArrowRightBold} size={1} />
            </ActionIcon>
          </Group>
        </>
      }
    >
      <Paper shadow="md" p="md" w="100%">
        <ScrollArea offsetScrollbars h="calc(100vh - 190px)">
          <Table className={classes.table}>
            <thead>
              <tr>
                <th>隐藏</th>
                <th>比赛</th>
                <th>比赛时间</th>
                <th>简介</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {games &&
                games.map((game) => {
                  const startTime = dayjs(game.start)
                  const endTime = dayjs(game.end)
                  const status = getGameStatus(startTime, endTime)
                  const color = GameColorMap.get(status)

                  return (
                    <tr key={game.id}>
                      <td>
                        <Switch
                          disabled={disabled}
                          checked={game.hidden ?? false}
                          onChange={() => onToggleHidden(game)}
                        />
                      </td>
                      <td>
                        <Group noWrap position="apart">
                          <Group
                            noWrap
                            position="left"
                            onClick={() => navigate(`/games/${game.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <Avatar alt="avatar" src={game.poster} radius={0}>
                              {game.title?.slice(0, 1)}
                            </Avatar>
                            <Text weight={700} lineClamp={1} maw="calc(10vw)">
                              {game.title}
                            </Text>
                          </Group>
                          <Badge color={color}>{status}</Badge>
                        </Group>
                      </td>
                      <td>
                        <Group noWrap spacing="xs">
                          <Badge size="xs" color={color} variant="dot">
                            {dayjs(startTime).format('YYYY-MM-DD HH:mm')}
                          </Badge>
                          <Icon path={mdiChevronTripleRight} size={1} />
                          <Badge size="xs" color={color} variant="dot">
                            {dayjs(endTime).format('YYYY-MM-DD HH:mm')}
                          </Badge>
                        </Group>
                      </td>
                      <td>
                        <Text lineClamp={1} w="calc(50vw - 20rem)">
                          {game.summary}
                        </Text>
                      </td>
                      <td>
                        <Group position="right">
                          <ActionIcon
                            onClick={() => {
                              navigate(`/admin/games/${game.id}/info`)
                            }}
                          >
                            <Icon path={mdiPencilOutline} size={1} />
                          </ActionIcon>
                        </Group>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </Table>
        </ScrollArea>
      </Paper>
      <GameCreateModal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        onAddGame={(game) => updateGames([...(games ?? []), game])}
      />
    </AdminPage>
  )
}

export default Games
