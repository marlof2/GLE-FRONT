import React, { useEffect, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { ActivityIndicator, FAB, Modal, Portal, Searchbar } from 'react-native-paper';
import styles from './styles';
import Header from '../../components/Header';
import api from "../../services";
import RenderItem from './componets/RenderItem'
import theme from '../../themes/theme.json'
import Form from './componets/form';
import Snackbar from '../../components/Ui/Snackbar';
import { useSelector, useDispatch } from 'react-redux';
import { infoModal, reloadItemsCard } from './reducer';
import EmptyListMessage from '../../components/Ui/EmptyListMessage';
import ModalDelete from './componets/ModalDelete'
// import { useIsFocused } from '@react-navigation/native'
// import { useNavigation } from '@react-navigation/native';

export default function Index() {
  const dispatch = useDispatch();
  // const navigation = useNavigation();
  // const isFocused = useIsFocused()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [itemsCount, setItemsCount] = useState(null);
  const visibleForm = useSelector((state) => state.establishment.modal.visible);
  const reloadListCard = useSelector((state) => state.establishment.reloadCards);


  useEffect(() => {
    getAll()

    return () => { }

  }, [])


  const getAll = async () => {
    if (loading) return;

    setLoading(true);
    const response = await api.get('/establishments', { params: search ? { search: search } : null })

    if (response.status == 200) {
      setItems(response.data.data);
      setNextPageUrl(response.data.next_page_url);
      setItemsCount(response.data.total)
      setRefreshing(false);
    }
    setLoading(false);
  }


  const getNextPageData = async () => {
    if (loadingMore || !nextPageUrl) return;

    setLoadingMore(true);
    try {
      const res = await api.get(nextPageUrl, { params: search ? { search: search } : null });
      setItems([...items, ...res.data.data]);
      setNextPageUrl(res.data.next_page_url);
    } catch (error) {
      console.log('erro ao consultar: ' + error)
    } finally {
      setLoadingMore(false);
    }
  };


  const handleRefresh = () => {
    setRefreshing(true);
    setItems([]);
    setNextPageUrl(null)
    getAll()
    setRefreshing(false);
  };


  const renderFooter = () => {
    if (loading || loadingMore) {
      return <ActivityIndicator animating={true} size='small' />;
    }
  };

  //RECARREGA A LISTA COM OS CARDS (ESSA AÇÃO VEM DO COMPONENTE FILHO RenderItem)
  if (reloadListCard) {
    dispatch(reloadItemsCard(false));
    handleRefresh()
  }


  // MODAL FORM ESSA AÇÃO VEM DO COMPOENETE PAI
  const openModal = () => {
    dispatch(infoModal({ action: 'create', visible: true }));

  }


  return (
    <View style={{ flex: 1 }}>

      <Header title={'Estabelecimentos'} />

      <Searchbar
        style={{ margin: 10, borderRadius: 15 }}
        placeholder="Nome, CPF, CNPJ e telefone"
        onChangeText={setSearch}
        value={search}
        onSubmitEditing={handleRefresh}
        onIconPress={handleRefresh}
        elevation={1}
      // onClearIconPress={closeSearch}
      />

      <View style={styles.background}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : ''}
          enabled
          style={styles.container}>

          <FlatList
            data={items}
            showsVerticalScrollIndicator
            keyExtractor={item => item.id}
            renderItem={(item) => (<RenderItem data={item} />)}
            contentContainerStyle={{ padding: 5, }}
            onEndReached={getNextPageData}
            onEndReachedThreshold={0}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={<EmptyListMessage count={itemsCount} message="Nenhum resultado encontrado." />}

          />
        </KeyboardAvoidingView>
      </View>

      <FAB
        color={theme.colors.white}
        label='Adicionar'
        icon="plus"
        style={styles.fab}
        onPress={openModal}
      />

      <Portal>
        <Modal visible={visibleForm} dismissable={!visibleForm} contentContainerStyle={{ borderRadius: 15, margin: 3 }}>
          <Form />
        </Modal>
      </Portal>

      <ModalDelete />

      <Snackbar />

    </View>
  )
}
